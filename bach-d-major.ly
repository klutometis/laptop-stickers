\score {
  \new Staff {
    \override Staff.StaffSymbol.line-thickness = #10
    \override Score.BarLine.thickness = #10
    
    \clef "bass"
    \key d \major
    \time 2/2
    
    r8 d' d' d' g4 b~ b8 e a g fis4 d
  }
}
