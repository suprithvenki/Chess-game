import { NgModule } from "@angular/core";
import { AppComponent } from "./app.component";
import { RouterOutlet } from "@angular/router";
import { ChessBoardComponent } from "./chess-board/chess-board.component";
import { BrowserModule } from "@angular/platform-browser";


@NgModule({
    declarations: [AppComponent, ChessBoardComponent],
    bootstrap: [AppComponent],
    exports: [ChessBoardComponent],
    imports: [BrowserModule]
})
export class AppModule {}