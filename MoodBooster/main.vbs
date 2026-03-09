' main.vbs - Mood Booster
' To add a quote: increase Dim quotes(N) by 1, add quotes(N) = "text", update Rnd() * total

Dim quotes(19) ' 20 quotes (index 0 to 19)
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
quotes(15) = "Clarity comes from action, not from thinking."
quotes(16) = "The best time to start was yesterday. The second best time is now."
quotes(17) = "Done is better than perfect."
quotes(18) = "Small progress is still progress."
quotes(19) = "Show up. That's already half the work."

Randomize ' shuffle the random generator
MsgBox quotes(Int(Rnd() * 20)), vbOKOnly, "Mood Booster" ' pick and show a random quote
