import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';

import { ChessMove, ComputerConfiguration, StockFishQueryParams, StockFishResponse } from './models';
import { Color, FENChar } from '../../chess-logic/models';

@Injectable({
  providedIn: 'root'
})
export class StockfishService {

  private readonly api: string = 'https://stockfish.online/api/s/v2.php';
  private http = inject(HttpClient);

  public computerConfiguration$ = new BehaviorSubject<ComputerConfiguration>({color: Color.Black, level: 1});

  /*
    It will give as the number in the array
    Based on UTF-16 will get the char code number for our char and will subtract it from the char code number of character 'a'
  */
  private convertColumnLetterToYCoord(string: string): number {
    return string.charCodeAt(0) - 'a'.charCodeAt(0);
  }
  
  /*
    In case move by stockfish include piece promotion
    Based on computer color it return the corresponding FENChar for this piece
  */
  private promotedPiece(piece: string | undefined): FENChar | null {
    if (!piece) return null;

    const computerColor: Color = this.computerConfiguration$.value.color;

    if (piece === 'n') return computerColor === Color.White ? FENChar.WhiteKnight : FENChar.BlackKnight;
    if (piece === 'b') return computerColor === Color.White ? FENChar.WhiteBishop : FENChar.BlackBishop;
    if (piece === 'r') return computerColor === Color.White ? FENChar.WhiteRook : FENChar.BlackRook;
    return computerColor === Color.White ? FENChar.WhiteQueen : FENChar.BlackQueen;
  }


  private moveFromStockFishString(move: string): ChessMove {
    // Example for move param: b7b6 (there could be 5 letters in case of promoted Piece)
    const prevY: number = this.convertColumnLetterToYCoord(move[0]);
    const prevX: number = Number(move[1]) - 1; // The API will give as the number and we need to subtract -1 cuz the array start at zero
    const newY: number = this.convertColumnLetterToYCoord(move[2]);
    const newX: number = Number(move[3]) - 1;
    const promotedPiece = this.promotedPiece(move[4]);
    return { prevX, prevY, newX, newY, promotedPiece };
  }

  public getBestMove(fen: string): Observable<ChessMove> {
    const queryParams: StockFishQueryParams = {
      fen,
      depth: this.computerConfiguration$.value.level,
    };

    let params = new HttpParams().appendAll(queryParams);

    return this.http.get<StockFishResponse>(this.api, { params })
      .pipe(
        switchMap(response => {
          const bestMove: string = response.bestmove.split(' ')[1];
          return of(this.moveFromStockFishString(bestMove))
        })
      )
  }
}
