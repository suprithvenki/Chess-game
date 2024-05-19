import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChessBoard } from '../chess-logic/chess-board.js';
import { Color, Coords, FENChar, SafeSquares, pieceImagePaths } from '../chess-logic/models.js';
import { SelectedSquare } from './models.js';

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent {
  public pieceImagePaths = pieceImagePaths;
  private chessBoard = new ChessBoard();
  public chessBoardView: (FENChar | null)[][] = this.chessBoard.chessBoardView;

  private selectedSquare: SelectedSquare = { piece: null };
  private pieceSafeSquare: Coords[] = [];

  public get safeSquares(): SafeSquares {
    return this.chessBoard.safeSquares;
  }

  public get playerColor(): Color {
    return this.chessBoard.playerColor;
  }

  public isSquareDark(x: number, y: number): boolean {
    return ChessBoard.isSquareDark(x, y);
  }

  public isSquareSelected(x: number, y: number): boolean {
    if (!this.selectedSquare.piece) return false;
    return this.selectedSquare.x === x && this.selectedSquare.y === y;
  }

  public isSquareSafeForSelectedPiece(x: number, y: number): boolean {
    return this.pieceSafeSquare.some(coords => coords.x === x && coords.y === y);
  }

  public selectingPiece(x: number, y: number): void {
    const piece: FENChar | null = this.chessBoardView[x][y];

    if (!piece) return;

    this.selectedSquare = { piece, x, y };
    this.pieceSafeSquare = this.safeSquares.get(x + ',' + y) || [];
  }
}
