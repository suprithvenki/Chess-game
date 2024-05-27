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

    private fiftyMoveRuleCounter: number = 0;
    private _isGameOver: boolean = false;
    private _gameOverMessage: string | undefined;

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

    public get isGameOver(): boolean {
        return this._isGameOver;
    }

    public get gameOverMessage(): string | undefined {
        return this._gameOverMessage;
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
    private isPositionSafeAfterMove(prevX: number, prevY: number, newX: number, newY: number): boolean {
        const piece: Piece | null = this.chessBoard[prevX][prevY];
        if (!piece) return false;

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
                        if (this.isPositionSafeAfterMove(x, y, newX, newY)) {
                            pieceSafeSquares.push({ x: newX, y: newY });
                        }
                    } else {
                        while (this.areCoordsValid(newX, newY)) {
                            newPiece = this.chessBoard[newX][newY];

                            // If encounter the same color piece stop scanning in this direction
                            if (newPiece && newPiece.color === piece.color) break;

                            if (this.isPositionSafeAfterMove(x, y, newX, newY)) {
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
        const isPositionSafe: boolean = this.isPositionSafeAfterMove(pawnX, pawnY, pawnNewPositionX, pawnNewPositionY);
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

        return this.isPositionSafeAfterMove(kingPositionX, kingPositionY, kingPositionX, firstNextKingPositionY) &&
            this.isPositionSafeAfterMove(kingPositionX, kingPositionY, kingPositionX, secondNextKingPositionY);
    }

    public move(prevX: number, prevY: number, newX: number, newY: number, promotedPiceType: FENChar | null): void {

        // Check if game is over
        if (this._isGameOver) throw new Error('Game is over, you cant play move');

        // Check for valid coords
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

        // For fifty move rule 
        const isPieceTaken: boolean = this.chessBoard[newX][newY] !== null;
        if (piece instanceof Pawn || isPieceTaken) {
            // If pawn is moved or piece is taken reset the counter
            this.fiftyMoveRuleCounter = 0;
        } else {
            // Else add to the counter (add 0.5 because this will be run by both players)
            this.fiftyMoveRuleCounter += 0.5;
        }

        // For special moves: (Castle - it moves the Rook, En Passant - it removes the enemy pawn)
        this.handlingSpecialMoves(piece, prevX, prevY, newX, newY);

        // Update the board if the function is called with promotedPiceType !== null
        if (promotedPiceType) {
            // In case of promotion
            this.chessBoard[newX][newY] = this.promotedPiece(promotedPiceType);
        } else {
            this.chessBoard[newX][newY] = piece;
        }
        this.chessBoard[prevX][prevY] = null;

        // Save last move
        this._lastMove = { piece, prevX, prevY, currX: newX, currY: newY };

        // Change color
        this._playerColor = this._playerColor === Color.White ? Color.Black : Color.White;

        // After changing the color check if current player is in check;
        this.isInCheck(this._playerColor, true);

        // Recalculate all safe squares for all pieces
        this._safeSquares = this.findSafeSquares();

        // Check if game have finished
        this._isGameOver = this.isGameFinished();
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

    // It creates new instance of piece base of the income parameters
    private promotedPiece(promotedPiceType: FENChar): Knight | Bishop | Rook | Queen {
        if (promotedPiceType === FENChar.WhiteKnight || promotedPiceType === FENChar.BlackKnight) return new Knight(this._playerColor);
        if (promotedPiceType === FENChar.WhiteBishop || promotedPiceType === FENChar.BlackBishop) return new Bishop(this._playerColor);
        if (promotedPiceType === FENChar.WhiteRook || promotedPiceType === FENChar.BlackRook) return new Rook(this._playerColor);
        return new Queen(this._playerColor);
    }

    // It check if the game have finished 
    private isGameFinished(): boolean {

        if (this.insufficientMaterial()) {
            this._gameOverMessage = 'Draw due to insufficient material position';
            return true;
        }

        // If there are no possible moves in safeSquares it means that the game is finish
        if (!this._safeSquares.size) {
            // If current player is in check that means that enemy player have won the game
            if (this._checkState.isInCheck) {
                const prevPlayer: string = this._playerColor === Color.White ? 'Black' : 'White';
                this._gameOverMessage = `${prevPlayer} won by checkmate`;
            } else {
                // If current player is not in check that means that game have ended in stalemate
                this._gameOverMessage = 'Stalemate';
            }

            return true;
        }

        // If game is over due to fifty move rule
        if (this.fiftyMoveRuleCounter === 50) {
            this._gameOverMessage = 'Draw due to fifty move rule';
            return true;
        }

        return false;
    }

    // Insufficient material 

    // The input will be all pieces for one of the colors 
    private playerHasOnlyTwoKnightsAndKing(pieces: { piece: Piece, x: number, y: number }[]): boolean {
        return pieces.filter(piece => piece.piece instanceof Knight).length === 2;
    }

    // The input will be all pieces for one of the colors 
    private playerHasOnlyBishopsWithSameColorAndKing(pieces: { piece: Piece, x: number, y: number }[]): boolean {
        const bishops = pieces.filter(piece => piece.piece instanceof Bishop);
        const areAllBishopsSameColor = new Set(bishops.map(bishop => ChessBoard.isSquareDark(bishop.x, bishop.y))).size === 1;

        // return true if we have only Bishops of same color and King (-1 because of the King)
        return bishops.length === pieces.length - 1 && areAllBishopsSameColor;
    }

    private insufficientMaterial(): boolean {
        const whitePieces: { piece: Piece, x: number, y: number }[] = [];
        const blackPieces: { piece: Piece, x: number, y: number }[] = [];

        // Adding all white and black pieces to the arrays
        for (let x = 0; x < this.chessBoardSize; x++) {
            for (let y = 0; y < this.chessBoardSize; y++) {
                const piece: Piece | null = this.chessBoard[x][y];
                if (!piece) continue;

                if (piece.color === Color.White) {
                    whitePieces.push({ piece, x, y });
                } else {
                    blackPieces.push({ piece, x, y });
                }
            }
        }

        // King vs King
        if (whitePieces.length === 1 && blackPieces.length === 1) {
            return true;
        }

        // King and Minor Piece vs King
        if (whitePieces.length === 1 && blackPieces.length === 2) {
            return blackPieces.some(piece => piece.piece instanceof Knight || piece.piece instanceof Bishop);
        } else if (whitePieces.length === 2 && blackPieces.length === 1) {
            return whitePieces.some(piece => piece.piece instanceof Knight || piece.piece instanceof Bishop);
        }
        // Both sides have bishop of same color 
        else if (whitePieces.length === 2 && blackPieces.length === 2) {
            const whiteBishop = whitePieces.find(piece => piece.piece instanceof Bishop);
            const blackBishop = blackPieces.find(piece => piece.piece instanceof Bishop);

            if (whiteBishop && blackBishop) {
                // It check if both bishops are on white or both are on black square
                const areBishopOfSameColor: boolean = ChessBoard.isSquareDark(whiteBishop.x, whiteBishop.y) && ChessBoard.isSquareDark(blackBishop.x, blackBishop.y) ||
                    !ChessBoard.isSquareDark(whiteBishop.x, whiteBishop.y) && !ChessBoard.isSquareDark(blackBishop.x, blackBishop.y);

                return areBishopOfSameColor;
            }
        }

        // One side have 2 Knights and King vs only King
        if (whitePieces.length === 3 && blackPieces.length === 1 && this.playerHasOnlyTwoKnightsAndKing(whitePieces) ||
            whitePieces.length === 1 && blackPieces.length === 3 && this.playerHasOnlyTwoKnightsAndKing(blackPieces)
        ) return true;

        // One side have only Bishops of same color and King vs only King
        if (whitePieces.length >= 3 && blackPieces.length === 1 && this.playerHasOnlyBishopsWithSameColorAndKing(whitePieces) ||
            whitePieces.length === 1 && blackPieces.length >= 3 && this.playerHasOnlyBishopsWithSameColorAndKing(blackPieces)
        ) return true

        return false;
    }
}