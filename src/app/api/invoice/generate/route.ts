import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

interface Meeting {
  id: string;
  summary: string;
  durationHours: number;
  date: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hourlyRate = 150, demoMode = false } = body;
    const session = await getServerSession(authOptions) as any;

    let meetings: Meeting[] = [];
    let totalHours = 0;
    let totalMeetings = 0;

    if (demoMode || !session?.accessToken) {
      // Simulate network delay for demo
      await new Promise((resolve) => setTimeout(resolve, 1500));
      totalMeetings = Math.floor(Math.random() * 15) + 5;
      totalHours = Number((totalMeetings * 0.75 + Math.random() * 5).toFixed(1));
      
      // Generate some fake meetings for demo mode
      for (let i = 0; i < totalMeetings; i++) {
        const duration = Number((Math.random() * 2 + 0.5).toFixed(1));
        meetings.push({
          id: `demo-${i}`,
          summary: `Mock Sync - Project ${String.fromCharCode(65 + i)}`,
          durationHours: duration,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } else {
      // Fetch real events from Google Calendar (Last 30 Days)
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&maxResults=250&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Google Calendar Error:", await response.text());
        throw new Error("Failed to fetch from Google Calendar");
      }

      const data = await response.json();
      const events = data.items || [];

      // Filter to relevant "meetings" (has attendees, not an all-day event)
      const validMeetings = events.filter((e: any) => 
        e.attendees && 
        e.attendees.length > 1 && 
        e.start?.dateTime && 
        e.end?.dateTime
      );

      totalMeetings = validMeetings.length;

      meetings = validMeetings.map((e: any) => {
        const start = new Date(e.start.dateTime);
        const end = new Date(e.end.dateTime);
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        totalHours += durationHours;

        return {
          id: e.id,
          summary: e.summary || "Untitled Meeting",
          durationHours: Number(durationHours.toFixed(2)),
          date: start.toISOString(),
        };
      });

      totalHours = Number(totalHours.toFixed(1));
    }

    const calculatedCost = totalHours * Number(hourlyRate);

    return NextResponse.json({
      invoice: {
        totalMeetings,
        totalHours,
        hourlyRate: Number(hourlyRate),
        calculatedCost,
        dateRange: "Last 30 Days",
        meetings: meetings.sort((a: Meeting, b: Meeting) => new Date(b.date).getTime() - new Date(a.date).getTime()), // Sort newest first
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice." },
      { status: 500 }
    );
  }
}
