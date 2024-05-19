import { FENChar, Coords, Color } from "./models.js";
import { Piece } from "./piece.js";

export class Pawn extends Piece {
    private _hasMoved: boolean = false;
    protected override _FENChar: FENChar;
    protected override _directions: Coords[] = [
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: 2, y: 0 },
    ];

    constructor(private pieceColor: Color) {
        super(pieceColor);
        this._FENChar = pieceColor === Color.White ? FENChar.WhitePawn : FENChar.BlackPawn;
    }

    private setBlackPawnDirection(): void {
        this._directions = this._directions.map(({ x, y }) => ({ x: x * -1, y }));
    }

    public get hasMoved(): boolean {
        return this._hasMoved;
    }

    public set hasMoved(_) {
        this._hasMoved = true;
        this._directions = [
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 1, y: -1 },
        ]

        if (this.pieceColor === Color.Black) {
            this.setBlackPawnDirection();
        }
    }
}