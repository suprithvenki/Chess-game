import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';

import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { StockfishService } from './stockfish.service';
import { ChessBoardService } from '../chess-board/chess-board.service';

@Component({
  selector: 'app-computer-mode',
  templateUrl: '../chess-board/chess-board.component.html', // it uses chess-board template
  styleUrl: '../chess-board/chess-board.component.css',     // it uses chess-board css
})
export class ComputerModeComponent extends ChessBoardComponent implements OnInit, OnDestroy {
  // private subscriptions$ = new Subscription();
  constructor(private stockfishService: StockfishService) {
    super(inject(ChessBoardService));
  }

  ngOnInit(): void {
    const chessBoardStateSubscription: Subscription = this.chessBoardService.chessBoardState$.subscribe({
      next: async (FEN: string) => {
        
        // From FENnotation the second char will be the current player on move (color) 
        // For now the computer play only with the blacks
        const player: string = FEN.split(' ')[1];
        if(player === 'w') return;

        // Convert the observable response from stockFishAPI to promise
        const {prevX, prevY, newX, newY, promotedPiece} = await firstValueFrom(this.stockfishService.getBestMove(FEN));

        // Manually update the board with Sockfish API answer
        this.updateBoard(prevX, prevY, newX, newY, promotedPiece)
      }
    });

    this.subscriptions$.add(chessBoardStateSubscription);
  }

  override ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }
}
