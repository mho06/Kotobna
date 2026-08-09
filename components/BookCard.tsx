"use client";

import { useState } from "react";
import Image from "next/image";
import { Book } from "@/lib/types";
import { getWhatsAppLink } from "@/lib/whatsapp";

export default function BookCard(props: { book: Book }) {
  const book = props.book;
  const [flipped, setFlipped] = useState(false);

  function handleFlip() {
    if (!book.back_image_url) return;
    setFlipped(function (f) { return !f; });
  }

  return (
    <div className="bg-card border border-ink/10 rounded-card overflow-hidden shadow-[0_2px_10px_-4px_rgba(43,38,32,0.15)] hover:shadow-[0_10px_24px_-8px_rgba(43,38,32,0.25)] hover:-translate-y-1 transition-all">
      <div className="tilt-wrapper aspect-[3/4] w-full relative bg-cream-dark" onClick={handleFlip}>
        <div className={"flip-card " + (flipped ? "is-flipped" : "")}>
          <div className="flip-card-face flip-card-front overflow-hidden">
            {book.front_image_url ? (
              <Image
                src={book.front_image_url}
                alt={book.title}
                fill
                draggable={false}
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cream-dark text-ink/40 font-display text-sm">
                No cover
              </div>
            )}
          </div>
          {book.back_image_url && (
            <div className="flip-card-face flip-card-back overflow-hidden">
              <Image
                src={book.back_image_url}
                alt={book.title + " back cover"}
                fill
                draggable={false}
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 25vw"
              />
            </div>
          )}
        </div>
        {book.genre && (
          <span className="absolute top-2 left-2 bg-forest text-cream font-mono text-[9px] uppercase tracking-widest px-2 py-1 rounded-full pointer-events-none">
            {book.genre}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display font-semibold text-base leading-tight mb-0.5">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-ink/60 mb-3">{book.author}</p>
        )}

        <div className="flex items-center justify-between gap-2 mt-2">
          {book.price ? (
            <span className="font-mono text-sm text-ochre font-semibold">{book.price}</span>
          ) : (
            <span />
          )}
          <a
            href={getWhatsAppLink(book.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest bg-forest text-cream px-3 py-2 rounded-full hover:bg-forest-dark transition-colors"
          >
            Inquire
          </a>
        </div>
      </div>
    </div>
  );
}