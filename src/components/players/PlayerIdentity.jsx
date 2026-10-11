import { Image } from "@/components/ui/image";
import { LifecycleChip, NetChip, RiskChip } from "@/components/tags";
import InfoTip from "@/components/InfoTip";
import HoverTip from "@/components/HoverTip";
import { assessPlayerRisk } from '@/lib/playerStatus';

const AVATAR = "https://media.base44.com/images/public/6aba0bdf07f37e4078b1455a/1e345eab9_generated_image.png";

export default function PlayerIdentity({ player, tips, settings }) {
  const channels = player.channels || {};
  const assessment = assessPlayerRisk(player, settings);
  return <section className="lux-surface rounded-2xl border border-border bg-card p-5">
    <div className="flex items-start gap-4">
      <Image src={AVATAR} alt={`Pastel character avatar for ${player.name}`} className="w-20 h-20 rounded-2xl shrink-0 overflow-hidden" />
      <div className="min-w-0">
        <h1 className="font-heading font-semibold break-words">{player.name}</h1>
        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-semibold tabular-nums">{Number(player.score).toFixed(2)}<span className="text-sm text-muted-foreground font-normal"> / 10</span></span>
          <span className="text-[11px] text-muted-foreground">Score<InfoTip text={tips.score} /></span>
        </div>
        <p className="mt-2 text-[11px] font-mono text-muted-foreground break-all">{player.player_id}</p>
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-1.5 items-center">
      <HoverTip text={tips.lifecycle}><LifecycleChip v={player.lifecycle} /></HoverTip>
      <HoverTip text={tips.net}><NetChip v={player.net_vs_house} amount={player.net_amount} /></HoverTip>
      <HoverTip text={tips.risk}><RiskChip v={player.risk} /></HoverTip>
    </div>
    <p className="mt-4 text-xs text-muted-foreground">Tags follow your configured lifecycle and risk rules; net position is a separate cash gate.<InfoTip text="Watch means review; it does not itself reduce offers. Block offers enforces existing cash/survey restrictions. Missing risk inputs are not treated as zero." /></p>
    {!!assessment.reasons.length && <p className="mt-2 text-xs font-medium">{assessment.reasons.map(r => r.label).join('; ')}</p>}
    {!!assessment.missing.length && <p className="mt-2 text-[11px] text-muted-foreground">Incomplete risk data<InfoTip text={`Not evaluated: ${assessment.missing.join(', ')}. Clean means no available signal triggered, not that all risks were ruled out.`}/></p>}
    <div className="mt-6">
      <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Channels<InfoTip text="Connected delivery channels. Unavailable channels are not connected." /></h2>
      <div className="divide-y divide-border">
        {["site", "telegram", "whatsapp", "email"].map(channel => <div key={channel} className="flex items-center justify-between gap-2 py-2.5 text-xs">
          <span className="capitalize">{channel}</span><span className={channels[channel] ? "text-emerald-500 font-medium" : "text-muted-foreground"}>{channels[channel] ? "Connected" : "Unavailable"}</span>
        </div>)}
      </div>
    </div>
  </section>;
}