import { useState } from "react";
import { Gamepad2, Play, Send, MessageCircle, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MINI_GAMES, PROMO_IMAGE } from "@/components/examples/MiniGames";
import InfoTip from "@/components/InfoTip";

const MESSAGE = "🎁 Your weekend gift is ready, Alex!\nSpin the wheel and win up to 50 free spins on Sweet Bonanza. Offer ends Sunday at midnight.";
const LINK = "retenix.example/spin?c=weekend";

function TelegramPreview() {
  return (
    <div className="xg-phone xg-tg">
      <div className="xg-phonehead"><span className="xg-avatar">R</span><div>Retenix Casino<small>bot</small></div></div>
      <div className="xg-chat">
        <div className="xg-bubble">
          <img src={PROMO_IMAGE} alt="Gift box with coins and slot symbols" />
          <div className="xg-bubbletext">{MESSAGE}</div>
          <div className="xg-bubblemeta">12:04</div>
        </div>
        <div className="xg-tgbtn">🎡 Spin now</div>
      </div>
    </div>
  );
}

function WhatsAppPreview() {
  return (
    <div className="xg-phone xg-wa">
      <div className="xg-phonehead"><span className="xg-avatar">R</span><div>Retenix Casino<small>Business account</small></div></div>
      <div className="xg-chat">
        <div className="xg-bubble">
          <img src={PROMO_IMAGE} alt="Gift box with coins and slot symbols" />
          <div className="xg-bubbletext">{MESSAGE}</div>
          <span className="xg-walink">{LINK}</span>
          <div className="xg-bubblemeta">12:04 ✓✓</div>
        </div>
      </div>
    </div>
  );
}

function EmailPreview() {
  return (
    <div className="xg-mail">
      <div className="xg-mailbar"><span className="xg-maildots"><span /><span /><span /></span>Inbox</div>
      <div className="xg-mailhead">
        <div className="xg-mailsubject">Your weekend gift is ready 🎁</div>
        <div className="xg-mailfrom">Retenix Casino &lt;rewards@retenix.example&gt; · to Alex</div>
      </div>
      <div className="xg-mailbody">
        <img src={PROMO_IMAGE} alt="Gift box with coins and slot symbols" />
        <h4>Spin for up to 50 free spins</h4>
        <p>Hi Alex, we saved a spin on the prize wheel for you. Every spin wins something, and the top prize is 50 free spins on Sweet Bonanza. The offer ends Sunday at midnight.</p>
        <span className="xg-mailcta">Spin the wheel</span>
        <div className="xg-mailfoot">You&apos;re receiving this because you opted in to promotions. Unsubscribe anytime.</div>
      </div>
    </div>
  );
}

const MESSAGES = [
  { id: "telegram", title: "Telegram", icon: Send, Preview: TelegramPreview },
  { id: "whatsapp", title: "WhatsApp", icon: MessageCircle, Preview: WhatsAppPreview },
  { id: "email", title: "Email", icon: Mail, Preview: EmailPreview },
];

export default function Examples() {
  const [active, setActive] = useState(null);
  const game = MINI_GAMES.find((g) => g.id === active);

  return (
    <div className="ex-page">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-accent" />
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Examples</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">What players see from a case: on-site mini games and off-site messages.<InfoTip text="Click any mini game to open a playable demo. Prizes in demos are random and nothing is credited." /></p>
      </header>

      <section aria-labelledby="mini-games">
        <h2 id="mini-games" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mini games</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {MINI_GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActive(g.id)}
              className="group text-left lux-surface rounded-xl border border-border bg-card p-3 transition hover:border-accent hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="xg-thumb"><g.Thumb /></div>
              <div className="mt-3 flex items-start justify-between gap-3 px-1 pb-1">
                <div>
                  <div className="font-semibold">{g.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{g.blurb}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 text-accent px-2.5 py-1 text-xs font-semibold shrink-0 group-hover:bg-accent group-hover:text-accent-foreground transition"><Play className="w-3.5 h-3.5" /> Play</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="message-copy" className="mt-10">
        <h2 id="message-copy" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Message copy — off-site channels</h2>
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {MESSAGES.map((m) => (
            <div key={m.id}>
              <div className="flex items-center gap-1.5 text-sm font-semibold mb-2"><m.icon className="w-4 h-4 text-accent" />{m.title}</div>
              <m.Preview />
            </div>
          ))}
        </div>
      </section>

      <Dialog open={!!game} onOpenChange={(o) => { if (!o) setActive(null); }}>
        <DialogContent className="max-w-2xl bg-card border-border">
          {game && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-accent" /> {game.title} — demo</DialogTitle>
                <DialogDescription>{game.blurb} This is a demo; nothing is credited.</DialogDescription>
              </DialogHeader>
              <game.Demo key={game.id} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
