import { Bishop } from "./pieces/bishop.js";
import { King } from "./pieces/king.js";
import { Knight } from "./pieces/knight.js";
import { CheckState, Color, Coords, FENChar, LastMove, SafeSquares } from "./models.js";
import { Pawn } from "./pieces/pawn.js";
import { Piece } from "./pieces/piece.js";
import { Queen } from "./pieces/queen.js";
import { Rook } from "./pieces/rook.js";

export class ChessBoard {
    private readonly chessBoardSize: number = 8;
    private chessBoard: (Piece | null)[][];
    private _playerColor = Color.White;
    private _safeSquares: SafeSquares;
    private _lastMove: LastMove | undefined;
    private _checkState: CheckState = { isInCheck: false };

    constructor() {
        this.chessBoard = [
            [
                new Rook(Color.White), new Knight(Color.White), new Bishop(Color.White), new Queen(Color.White),
                new King(Color.White), new Bishop(Color.White), new Knight(Color.White), new Rook(Color.White)
            ],
            [
                new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White),
                new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White), new Pawn(Color.White)
            ],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [
                new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black),
                new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black), new Pawn(Color.Black)
            ],
            [
                new Rook(Color.Black), new Knight(Color.Black), new Bishop(Color.Black), new Queen(Color.Black),
                new King(Color.Black), new Bishop(Color.Black), new Knight(Color.Black), new Rook(Color.Black)
            ]
        ]

        this._safeSquares = this.findSafeSquares();
    }

    public get playerColor(): Color {
        return this._playerColor;
    }

    public get chessBoardView(): (FENChar | null)[][] {
        return this.chessBoard.map(row => {
            return row.map(piece => piece instanceof Piece ? piece.FENChar : null);
        })
    }

    public get safeSquares(): SafeSquares {
        return this._safeSquares;
    }

    public get lastMove(): LastMove | undefined {
        return this._lastMove;
    }

    public get checkState(): CheckState {
        return this._checkState;
    }

    public static isSquareDark(x: number, y: number): boolean {
        return x % 2 === 0 && y % 2 === 0 || x % 2 === 1 && y % 2 === 1;
    }

    private areCoordsValid(x: number, y: number): boolean {
        return x < this.chessBoardSize && y < this.chessBoardSize && x >= 0 && y >= 0;
    }

    // Check if King is in check
    public isInCheck(playerColor: Color, checkingCurrentPosition: boolean): boolean {
        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];

                if (!piece || piece.color === playerColor) continue;

                // Check every possible attack for this piece 
                for (const { x: dx, y: dy } of piece.directions) {
                    let newX: number = x + dx;
                    let newY: number = y + dy;

                    if (!this.areCoordsValid(newX, newY)) continue;

                    if (piece instanceof Pawn || piece instanceof Knight || piece instanceof King) {
                        // Pawns can attack only diagonally
                        if (piece instanceof Pawn && dy === 0) continue;

                        const attackedPiece: Piece | null = this.chessBoard[newX][newY];
                        if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                            // checkingCurrentPosition is a boolean for real check (otherwise the check is for safe next move)
                            if (checkingCurrentPosition) this._checkState = { isInCheck: true, x: newX, y: newY };
                            return true;
                        }

                    } else {
                        // For case (Queen, Rook, Bishop)
                        while (this.areCoordsValid(newX, newY)) {
                            const attackedPiece: Piece | null = this.chessBoard[newX][newY];
                            if (attackedPiece instanceof King && attackedPiece.color === playerColor) {
                                // checkingCurrentPosition is a boolean for real check (otherwise the check is for safe next move)
                                if (checkingCurrentPosition) this._checkState = { isInCheck: true, x: newX, y: newY };
                                return true;
                            }

                            // break if there are other pieces on attacked row - diagonal
                            if (attackedPiece !== null) break;

                            newX += dx;
                            newY += dy;
                        }
                    }
                }
            }
        }
        if (checkingCurrentPosition) this._checkState = { isInCheck: false };
        return false;
    }

    // It check if after the move our King is safe 
    private isPositionSafeAfterMove(piece: Piece, prevX: number, prevY: number, newX: number, newY: number): boolean {
        const newPiece: Piece | null = this.chessBoard[newX][newY];

        // cant put piece on a square that already contain piece of the same color
        if (newPiece && newPiece.color === piece.color) return false;

        // simulate position
        this.chessBoard[prevX][prevY] = null;
        this.chessBoard[newX][newY] = piece;

        const isPositionSafe: boolean = !this.isInCheck(piece.color, false);

        // restore position back
        this.chessBoard[prevX][prevY] = piece;
        this.chessBoard[newX][newY] = newPiece;

        return isPositionSafe;
    }

    // Find all possible moves for every piece of current player color
    private findSafeSquares(): SafeSquares {
        const safeSquares: SafeSquares = new Map<string, Coords[]>();

        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];
                // cannot move pieces from opposite color
                if (!piece || piece.color !== this._playerColor) continue;

                const pieceSafeSquares: Coords[] = [];

                for (const { x: dx, y: dy } of piece.directions) {
                    let newX: number = x + dx;
                    let newY: number = y + dy;

                    if (!this.areCoordsValid(newX, newY)) continue;

                    let newPiece: Piece | null = this.chessBoard[newX][newY];

                    // cant put piece on a square that already contain piece of our color
                    if (newPiece && newPiece.color === piece.color) continue;

                    // need to restrict pawn moves in certain direction
                    if (piece instanceof Pawn) {

                        // if there are already a pice cannot move 2 forward
                        if (dx === 2 || dx === -2) {
                            if (newPiece) continue;
                            // TODO check if this is needed
                            if (this.chessBoard[newX + (dx === 2 ? -1 : 1)][newY]) continue;
                        }

                        // cant move pawn one square straight if piece is in front 
                        if ((dx === 1 || dx === -1) && dy === 0 && newPiece) continue;

                        // cant move pawn diagonally if there is no piece or piece has the same color
                        if ((dy === 1 || dy === -1) && (!newPiece || piece.color === newPiece.color)) continue;
                    }

                    if (piece instanceof Pawn || piece instanceof Knight || piece instanceof King) {
                        if (this.isPositionSafeAfterMove(piece, x, y, newX, newY)) {
                            pieceSafeSquares.push({ x: newX, y: newY });
                        }
                    } else {
                        while (this.areCoordsValid(newX, newY)) {
                            newPiece = this.chessBoard[newX][newY];

                            // If encounter the same color piece stop scanning in this direction
                            if (newPiece && newPiece.color === piece.color) break;

                            if (this.isPositionSafeAfterMove(piece, x, y, newX, newY)) {
                                pieceSafeSquares.push({ x: newX, y: newY });
                            }

                            // If the position is safe after move it should be already added. Now even if find 
                            // a piece from the opposite color break since cant go any further  
                            if (newPiece !== null) break;

                            newX += dx;
                            newY += dy;
                        }
                    }
                }

                // Add to safeSquares coordinates if king can castle
                if (piece instanceof King) {
                    // Check if it can castle king side
                    if (this.canCastle(piece, true)) pieceSafeSquares.push({ x, y: 6 });
                    // Check if it can castle queen side
                    if (this.canCastle(piece, false)) pieceSafeSquares.push({ x, y: 2 });
                }
                // Add to safeSquares coordinates if pawn can En Passant
                else if (piece instanceof Pawn && this.canCaptureEnPassant(piece, x, y)) {
                    pieceSafeSquares.push({ x: x + (piece.color === Color.White ? 1 : -1), y: this._lastMove!.prevY });
                }

                // Add possible moves for every piece base on coordinate as key
                if (pieceSafeSquares.length) {
                    safeSquares.set(x + ',' + y, pieceSafeSquares);
                }
            }
        }

        return safeSquares;
    }

    // It check if En Passant is possible
    private canCaptureEnPassant(pawn: Pawn, pawnX: number, pawnY: number): boolean {
        // If there isn't last move En Passant is not possible
        if (!this._lastMove) return false;

        const { piece, prevX, prevY, currX, currY } = this._lastMove;
        // requirements for En Passant
        if (!(piece instanceof Pawn) ||
            pawn.color !== this._playerColor ||
            Math.abs(currX - prevX) !== 2 ||
            pawnX !== currX ||
            Math.abs(pawnY - currY) !== 1
        ) return false;

        const pawnNewPositionX: number = pawnX + (pawn.color === Color.White ? 1 : -1);
        const pawnNewPositionY: number = currY;

        // Remove enemy pawn check if position is safe after enPassant move, then return enemy pawn to its position
        this.chessBoard[currX][currY] = null;
        const isPositionSafe: boolean = this.isPositionSafeAfterMove(pawn, pawnX, pawnY, pawnNewPositionX, pawnNewPositionY);
        this.chessBoard[currX][currY] = piece;

        return isPositionSafe;
    }

    // It check if castle is possible
    private canCastle(king: King, kingSideCastle: boolean): boolean {
        if (king.hasMoved) return false;

        const kingPositionX: number = king.color === Color.White ? 0 : 7;
        const kingPositionY: number = 4;
        const rookPositionX: number = kingPositionX;
        const rookPositionY: number = kingSideCastle ? 7 : 0;
        const rook: Piece | null = this.chessBoard[rookPositionX][rookPositionY];

        if (!(rook instanceof Rook) || rook.hasMoved || this._checkState.isInCheck) return false;

        const firstNextKingPositionY: number = kingPositionY + (kingSideCastle ? 1 : -1);
        const secondNextKingPositionY: number = kingPositionY + (kingSideCastle ? 2 : -2);

        if (this.chessBoard[kingPositionX][firstNextKingPositionY] || this.chessBoard[kingPositionX][secondNextKingPositionY]) return false;

        if (!kingSideCastle && this.chessBoard[kingPositionX][1]) return false;

        return this.isPositionSafeAfterMove(king, kingPositionX, kingPositionY, kingPositionX, firstNextKingPositionY) &&
            this.isPositionSafeAfterMove(king, kingPositionX, kingPositionY, kingPositionX, secondNextKingPositionY);
    }

    public move(prevX: number, prevY: number, newX: number, newY: number): void {
        if (!this.areCoordsValid(prevX, prevY) || !this.areCoordsValid(newX, newY)) return;

        // Check for color
        const piece: Piece | null = this.chessBoard[prevX][prevY];
        if (!piece || piece.color !== this._playerColor) return;

        // Check if the new coords are safe
        const pieceSafeSquares: Coords[] | undefined = this._safeSquares.get(prevX + ',' + prevY);
        if (!pieceSafeSquares || !pieceSafeSquares.find(coords => coords.x === newX && coords.y === newY)) {
            throw new Error('Square is not safe');
        }

        // Set hasMoved
        if ((piece instanceof Pawn || piece instanceof King || piece instanceof Rook) && !piece.hasMoved) {
            piece.hasMoved = true;
        }

        // For special moves: (Castle - it moves the Rook, En Passant - it removes the enemy pawn)
        this.handlingSpecialMoves(piece, prevX, prevY, newX, newY);

        // Update the board
        this.chessBoard[prevX][prevY] = null;
        this.chessBoard[newX][newY] = piece;

        // Save last move
        this._lastMove = { piece, prevX, prevY, currX: newX, currY: newY };

        // Change color
        this._playerColor = this._playerColor === Color.White ? Color.Black : Color.White;

        // After changing the color check if current player is in check;
        this.isInCheck(this._playerColor, true);

        // Recalculate all safe squares for all pieces
        this._safeSquares = this.findSafeSquares();
    }

    private handlingSpecialMoves(piece: Piece, prevX: number, prevY: number, newX: number, newY: number): void {
        // For case: Castle 
        // It moves the Rook after Castle
        if (piece instanceof King && Math.abs(newY - prevY) === 2) {
            // newY > prevY === king side castle

            // Take ref to the rook
            const rookPositionX: number = prevX;
            const rookPositionY: number = newY > prevY ? 7 : 0;
            const rook = this.chessBoard[rookPositionX][rookPositionY] as Rook;
            const rookNewPositionY: number = newY > prevY ? 5 : 3;

            // Move the rook
            this.chessBoard[rookPositionX][rookPositionY] = null;
            this.chessBoard[rookPositionX][rookNewPositionY] = rook;
            rook.hasMoved = true;
        }
        // For case: En Passant
        // It removes the enemy pawn
        else if (
            piece instanceof Pawn &&
            this._lastMove &&
            this._lastMove.piece instanceof Pawn &&
            Math.abs(this._lastMove.currX - this._lastMove.prevX) === 2 &&
            prevX === this._lastMove.currX &&
            newY === this._lastMove.currY
        ) {
            this.chessBoard[this._lastMove.currX][this._lastMove.currY] = null;
        }
    }
}