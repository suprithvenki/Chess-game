import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';

import { ChessMove, StockFishQueryParams, StockFishResponse } from './models';
import { FENChar } from '../../chess-logic/models';

@Injectable({
  providedIn: 'root'
})
export class StockfishService {

  private readonly api: string = 'https://stockfish.online/api/s/v2.php';
  private http = inject(HttpClient);

  //
  private convertColumnLetterToYCoord(string: string): number {
    return string.charCodeAt(0) - 'a'.charCodeAt(0);
  }

  // In case best move by stockfish include piece promotion 
  // (the move will have 5 char in that case and this should handle the last one) 
  private promotedPiece(piece: string | undefined): FENChar | null {
    if (!piece) return null;
    if (piece === 'n') return FENChar.BlackKnight;
    if (piece === 'b') return FENChar.BlackBishop;
    if (piece === 'r') return FENChar.BlackRook;
    return FENChar.BlackQueen;
  }


  private moveFromStockFishString(move: string): ChessMove {
    // Example for move param: b7b6 (there could be 5 letters in case of promoted Piece)
    const prevY: number = this.convertColumnLetterToYCoord(move[0]);
    const prevX: number = Number(move[1]) - 1;
    const newY: number = this.convertColumnLetterToYCoord(move[2]);
    const newX: number = Number(move[3]) - 1;
    const promotedPiece = this.promotedPiece(move[4]);
    return { prevX, prevY, newX, newY, promotedPiece };
  }

  public getBestMove(fen: string): Observable<ChessMove> {
    const queryParams: StockFishQueryParams = {
      fen,
      depth: 13,
    };

    let params = new HttpParams().appendAll(queryParams);

    return this.http.get<StockFishResponse>(this.api, { params })
      .pipe(
        switchMap(response => {
          // TODO
          const bestMove: string = response.bestmove.split(' ')[1];
          return of(this.moveFromStockFishString(bestMove))
        })
      )
  }
}
