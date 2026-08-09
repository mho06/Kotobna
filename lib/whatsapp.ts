const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "961XXXXXXXX";

export function getWhatsAppLink(bookTitle: string): string {
  const message = encodeURIComponent(
    "Hi! I'm interested in the book \"" + bookTitle + "\" listed on Kotobna."
  );
  return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + message;
}
