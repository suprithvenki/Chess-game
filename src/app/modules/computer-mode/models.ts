import { FENChar } from "../../chess-logic/models"

export type StockFishQueryParams = {
    fen: string;
    depth: number;
}

export type ChessMove = {
    prevX: number;
    prevY: number;
    newX: number;
    newY: number;
    promotedPiece: FENChar | null;
}

export type StockFishResponse = {
    success: boolean;
    bestmove: string;
} 