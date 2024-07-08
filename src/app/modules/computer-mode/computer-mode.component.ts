import { Component, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { StockfishService } from './stockfish.service';

@Component({
  selector: 'app-computer-mode',
  templateUrl: '../chess-board/chess-board.component.html', // it uses chess-board template
  styleUrl: '../chess-board/chess-board.component.css',     // it uses chess-board css
})
export class ComputerModeComponent extends ChessBoardComponent implements OnInit {

  constructor(private stockfishService: StockfishService) {
    super()
  }

  ngOnInit(): void {
    
  }
}
