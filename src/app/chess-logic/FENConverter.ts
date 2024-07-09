import { columns } from "../modules/chess-board/models.js";
import { Color, LastMove } from "./models.js";
import { King } from "./pieces/king.js";
import { Pawn } from "./pieces/pawn.js";
import { Piece } from "./pieces/piece.js";
import { Rook } from "./pieces/rook.js";

export class FENConverter {

    public static readonly initialPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    // It converts the board into Forsyth–Edwards Notation more info here: https://en.wikipedia.org/wiki/Forsyth-Edwards_Notation
    public convertBoardToFEN(
        board: (Piece | null)[][],
        playerColor: Color,
        lastMove: LastMove | undefined,
        fiftyMoveRuleCounter: number,
        numberOfFullMoves: number
    ): string {
        let FEN: string = '';

        // ---FIRST PART OF FEN--- (Piece placement)
        FEN += this.rowsConversion(board);

        // ---SECOND PART OF FEN--- (active color)
        const player: string = playerColor === Color.White ? 'w' : 'b';
        FEN += ' ' + player;

        // ---THIRD PART OF FEN--- (Castling availability)
        FEN += ' ' + this.castlingAvailability(board);

        // ---FORTH PART OF FEN--- (En passant target square)
        FEN += ' ' + this.enPassantPossibility(lastMove, playerColor);

        // ---FIFTH PART OF FEN--- (fifty move rule)
        FEN += ' ' + fiftyMoveRuleCounter * 2;

        // ---SIXTH PART OF FEN--- (number of moves)
        FEN += ' ' + numberOfFullMoves;
        return FEN;
    }

    private rowsConversion(board: (Piece | null)[][]): string {
        let rowsAsFEN = ''

        // Reverse because starting from the black pieces 
        for (let i = 7; i >= 0; i--) {
            let FENRow: string = '';
            let consecutiveEmptySquaresCounter = 0;

            // Loop trough the row and add FEN char to FENRow variable, or sum of numbers for every empty square
            for (const piece of board[i]) {
                // In case the square is empty
                if (!piece) {
                    consecutiveEmptySquaresCounter++;
                    continue;
                }

                // Add the number of empty square (for case empty squares between pieces)
                if (consecutiveEmptySquaresCounter !== 0) FENRow += String(consecutiveEmptySquaresCounter);

                consecutiveEmptySquaresCounter = 0;
                FENRow += piece.FENChar
            }

            // Add the number of empty square
            if (consecutiveEmptySquaresCounter !== 0) FENRow += String(consecutiveEmptySquaresCounter);

            // Add '/' between the rows but don't add for the last row
            rowsAsFEN += (i === 0) ? FENRow : FENRow + '/';
        }

        return rowsAsFEN;
    }

    // It check for castling availability for both white and black and return the result in FEN format
    private castlingAvailability(board: (Piece | null)[][]): string {

        // Given the color check for castling possibilities 
        const castlingPossibilities = (color: Color): string => {
            let castlingAvailability: string = '';

            const kingPositionX: number = color === Color.White ? 0 : 7;
            const king: Piece | null = board[kingPositionX][4];

            if (king instanceof King && !king.hasMoved) {
                const rookPositionX: number = kingPositionX;
                const kingSideRook = board[rookPositionX][7];
                const queenSideRook = board[rookPositionX][0];

                if (kingSideRook instanceof Rook && !kingSideRook.hasMoved) {
                    castlingAvailability += 'k';
                }

                if (queenSideRook instanceof Rook && !queenSideRook.hasMoved) {
                    castlingAvailability += 'q';
                }

                if (color === Color.White) {
                    castlingAvailability = castlingAvailability.toUpperCase();
                }
            }
            return castlingAvailability;
        }

        const castlingAvailability: string = castlingPossibilities(Color.White) + castlingPossibilities(Color.Black);
        // If we have variants for castling return them else return just '-'
        return castlingAvailability !== '' ? castlingAvailability : '-';
    }

    // It check for En Passant availability and return the result in FEN format
    private enPassantPossibility(lastMove: LastMove | undefined, color: Color): string {
        if (!lastMove) return '-';

        const { piece, currX: newX, prevX, prevY } = lastMove;

        // If last move was Pawn and was 2 square forward 
        if (piece instanceof Pawn && Math.abs(newX - prevX) === 2) {
            const row: number = color === Color.White ? 6 : 3;
            return columns[prevY] + String(row);
        }

        return '-';
    }
}