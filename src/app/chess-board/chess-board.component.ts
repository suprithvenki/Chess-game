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

  // For css
  public isSquareDark(x: number, y: number): boolean {
    return ChessBoard.isSquareDark(x, y);
  }

  // For css
  public isSquareSelected(x: number, y: number): boolean {
    if (!this.selectedSquare.piece) return false;
    return this.selectedSquare.x === x && this.selectedSquare.y === y;
  }

  public isSquareSafeForSelectedPiece(x: number, y: number): boolean {
    return this.pieceSafeSquare.some(coords => coords.x === x && coords.y === y);
  }

  // it will select the piece and hold it in component variable 'selectedSquare'
  public selectingPiece(x: number, y: number): void {
    const piece: FENChar | null = this.chessBoardView[x][y];
    if (!piece) return;
    if (this.isWrongPieceSelected(piece)) return;

    this.selectedSquare = { piece, x, y };
    // Store the safe moves for selected piece
    this.pieceSafeSquare = this.safeSquares.get(x + ',' + y) || [];
  }

  // It will call the move method on the chess board and after that will change the chess board view
  private placingPiece(newX: number, newY: number): void {
    if (!this.selectedSquare.piece) return;
    if (!this.isSquareSafeForSelectedPiece(newX, newY)) return;

    const { x: prevX, y: prevY } = this.selectedSquare;
    this.chessBoard.move(prevX, prevY, newX, newY);
    this.chessBoardView = this.chessBoard.chessBoardView;
  }

  // It will be run called every time when a square is clicked
  public move(x: number, y: number): void {
    this.selectingPiece(x, y);
    this.placingPiece(x, y);
  }

  // Guard for clicking on enemy pieces
  private isWrongPieceSelected(piece: FENChar): boolean {
    const isWhitePieceSelected: boolean = piece === piece.toLocaleUpperCase();
    return isWhitePieceSelected && this.playerColor === Color.Black ||
      !isWhitePieceSelected && this.playerColor === Color.White;
  }
}
