import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouterOutlet } from "@angular/router";
import { HttpClient } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { ChessBoardComponent } from "./modules/chess-board/chess-board.component";
import { ComputerModeComponent } from "./modules/computer-mode/computer-mode.component";
import { AppRoutingModule } from "./routes/app-router.module";
import { NavMenuComponent } from "./modules/nav-menu/nav-menu.component";



@NgModule({
    declarations: [
        AppComponent,
        ChessBoardComponent,
        ComputerModeComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NavMenuComponent
    ],
    providers: [HttpClient],
    bootstrap: [AppComponent]
})
export class AppModule { }