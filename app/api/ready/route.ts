import { NextResponse } from "next/server"; 
import { db } from "@/lib/db";
import { meals } from "@/lib/schema";

// This endpoint is used to check if the database is ready to be used
export async function GET() { 
    try {
        await db.select().from(meals).limit(1);
        return NextResponse.json({ status: "ok" });
    } catch {
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}