"use client";
// Drop a question into the well. The answer comes up on wet paper, with where the frog learned it.
import { useEffect, useRef, useState } from "react";
import { recall, remember, emit } from "@/lib/state";
import { sound } from "@/lib/sound";

type Turn = { role: "user" | "assistant"; content: string };
const READ_SO_FAR = 1_312_406;

export function Oracle({ onClose }: { onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(0);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAsked(recall().asked);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" }); // braces matter: newer Chrome returns a Promise here
  }, [turns]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || busy) return;
    const history: Turn[] = [...turns, { role: "user", content: question }];
    const answer = (content: string) => setTurns([...history, { role: "assistant", content }]);
    setDraft("");
    setBusy(true);
    answer("");
    sound.splash();
    remember({ asked: asked + 1 });
    setAsked(asked + 1);

    try {
      // The API only accepts the last few turns, always starting with the visitor.
      const response = await fetch("/api/frog", {
        method: "POST",
        body: JSON.stringify({ messages: history.slice(-11) }),
      });
      if (!response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        text += decoder.decode(chunk.value, { stream: true });
        answer(text);
      }
      sound.croak(1, 0.2);
      emit("speak");
    } catch {
      answer("The rope slipped. Ask again.");
    }
    setBusy(false);
  }

  return (
    <div className="oracle" role="dialog" aria-label="Ask the well">
      <button className="oracle-close quiet" onClick={onClose}>Close</button>
      <div className="oracle-log" aria-live="polite">
        <p className="oracle-count">Question {(READ_SO_FAR + asked + 1).toLocaleString("en")}</p>
        {turns.length === 0 && (
          <p className="say seen">
            Write it down and drop it in. I answer only from what has fallen into the well, and I will tell you
            when I do not know.
          </p>
        )}
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <p key={i} className="oracle-question">{turn.content}</p>
          ) : (
            <p key={i} className="oracle-answer">{turn.content || "…"}</p>
          ),
        )}
        <div ref={end} />
      </div>
      <form onSubmit={ask}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={600}
          placeholder="What did Munawwar build at Jan Elaaj?"
          aria-label="Your question"
        />
        <button className="act" disabled={busy}>Drop it in</button>
      </form>
    </div>
  );
}
