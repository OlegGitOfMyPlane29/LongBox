def register_user(client, email, password="secret123", display_name="Игрок"):
    response = client.post(
        "/auth/register",
        json={"email": email, "password": password, "display_name": display_name},
    )
    assert response.status_code == 200
    return response.json()


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_auth_challenge_flow_and_feed(client):
    register_data = register_user(client, "user1@example.com")
    token = register_data["access_token"]

    login_response = client.post(
        "/auth/login",
        json={"email": "user1@example.com", "password": "secret123"},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == "user1@example.com"

    create_response = client.post(
        "/challenges",
        headers=auth_header(token),
        json={"title": "Кубический режим", "habits": ["Бег", "Чтение"]},
    )
    assert create_response.status_code == 200
    challenge = create_response.json()

    success_log = client.post(
        f"/challenges/{challenge['id']}/logs",
        headers=auth_header(token),
        json={"status": "success", "comment": "День прошел отлично"},
    )
    assert success_log.status_code == 200
    assert len(success_log.json()["logs"]) == 1

    fail_log = client.post(
        f"/challenges/{challenge['id']}/logs",
        headers=auth_header(token),
        json={"status": "fail", "comment": "Сорвался на второй день"},
    )
    assert fail_log.status_code == 200
    assert fail_log.json()["reward"] == "Медный кубок"
    assert fail_log.json()["is_finished"] is True

    feed = client.get("/feed/challenges", headers=auth_header(token))
    assert feed.status_code == 200
    assert any(item["challenge_id"] == challenge["id"] for item in feed.json())


def test_forbidden_edit_other_user_challenge(client):
    user_1 = register_user(client, "owner@example.com", display_name="Владелец")
    user_2 = register_user(client, "other@example.com", display_name="Другой")

    created = client.post(
        "/challenges",
        headers=auth_header(user_1["access_token"]),
        json={"title": "Моя цель", "habits": ["Практика"]},
    )
    assert created.status_code == 200
    challenge_id = created.json()["id"]

    forbidden = client.patch(
        f"/challenges/{challenge_id}",
        headers=auth_header(user_2["access_token"]),
        json={"title": "Чужая правка", "habits": ["Взлом"]},
    )
    assert forbidden.status_code == 403


def test_hundredth_day_requires_final_comment(client):
    user = register_user(client, "runner@example.com", display_name="Спринтер")
    token = user["access_token"]

    create_response = client.post(
        "/challenges",
        headers=auth_header(token),
        json={"title": "100 дней фокуса", "habits": ["Фокус"]},
    )
    challenge_id = create_response.json()["id"]

    for day in range(1, 100):
        response = client.post(
            f"/challenges/{challenge_id}/logs",
            headers=auth_header(token),
            json={"status": "success", "comment": f"День {day} завершен"},
        )
        assert response.status_code == 200

    without_final = client.post(
        f"/challenges/{challenge_id}/logs",
        headers=auth_header(token),
        json={"status": "success", "comment": "Финальный день"},
    )
    assert without_final.status_code == 400
    assert "итоговый комментарий" in without_final.json()["detail"].lower()

    with_final = client.post(
        f"/challenges/{challenge_id}/logs",
        headers=auth_header(token),
        json={
            "status": "success",
            "comment": "Финальный день",
            "final_comment": "Закончил 100 дней и стал сильнее",
        },
    )
    assert with_final.status_code == 200
    body = with_final.json()
    assert body["reward"] == "Золотой кубок"
    assert body["is_finished"] is True


def test_random_quote_returns_fallback_if_provider_fails(client, monkeypatch):
    def broken_provider_1():
        raise RuntimeError("provider down")

    def broken_provider_2():
        raise RuntimeError("provider down")

    monkeypatch.setattr("app.routers.quotes._request_quotable_quote", broken_provider_1)
    monkeypatch.setattr("app.routers.quotes._request_zenquotes_quote", broken_provider_2)

    response = client.get("/quotes/random")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "fallback"
    assert body["content"]
    assert body["author"]
