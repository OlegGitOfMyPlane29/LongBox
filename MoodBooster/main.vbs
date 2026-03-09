' main.vbs - Mood Booster
' Shows a random motivational quote in a Windows dialog.
' To add a quote: increase the number in Dim quotes(...) by 1
' and add a new line quotes(N) = "Your text."

' --- Quotes list ---
Dim quotes(14) ' 15 quotes (index 0 to 14)

quotes(0)  = "Start now. Perfection is the enemy of done."
quotes(1)  = "Every day is a new chance to be better than yesterday."
quotes(2)  = "Don't wait for inspiration. Action creates inspiration."
quotes(3)  = "One small step every day is a big journey in a year."
quotes(4)  = "Hard doesn't mean impossible."
quotes(5)  = "You already took the first step by opening this app."
quotes(6)  = "Productivity is not doing more. It's doing what matters."
quotes(7)  = "Focus on progress, not perfection."
quotes(8)  = "One hour of focused work beats three hours of distraction."
quotes(9)  = "You are capable of far more than you think."
quotes(10) = "Tired? Rest. But don't quit."
quotes(11) = "Discipline is the bridge between goals and results."
quotes(12) = "Don't compare yourself to others. Compare yourself to who you were yesterday."
quotes(13) = "A good start is half the battle."
quotes(14) = "Every task you finish makes the next one a little easier."

' --- Pick a random quote ---
Randomize
Dim index
index = Int(Rnd() * 15) ' random number from 0 to 14

' --- Show the quote in a dialog window ---
MsgBox quotes(index), vbOKOnly, "Mood Booster"
