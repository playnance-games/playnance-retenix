import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ImageIcon, Loader2, X } from 'lucide-react';
import CaseImage from '@/components/CaseImage';
import { Switch } from '@/components/ui/switch';

export default function CaseMediaFields({ editing, setEditing, setField }) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file, multiple = false) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setEditing(p => multiple ? { ...p, creatives: [...(p.creatives || []), file_uri] } : { ...p, image_uri: file_uri });
    } finally { setUploading(false); }
  };
  return <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
    <div className="text-sm font-semibold">Visual creative</div>
    <div className="flex flex-wrap gap-4 items-start">
      {editing.image_uri ? <div className="relative"><CaseImage uri={editing.image_uri} className="w-64 h-40 rounded-lg" /><button type="button" aria-label="Remove visual" onClick={() => setField('image_uri', '')} className="absolute right-2 top-2 rounded-full bg-destructive text-destructive-foreground p-1"><X size={14}/></button></div> : null}
      <label className="flex flex-col items-center justify-center w-64 h-40 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-accent text-muted-foreground gap-2">
        {uploading ? <Loader2 className="animate-spin"/> : <ImageIcon/>}<span className="text-xs">{uploading ? 'Uploading…' : editing.image_uri ? 'Replace image' : 'Upload image'}</span>
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </div>
    {editing.channel === 'site' && <div className="border-t border-border pt-4">
      <div className="text-xs font-medium mb-2">Additional visuals (A/B shuffle)</div>
      <div className="flex flex-wrap gap-3">{(editing.creatives || []).map((uri,i) => <div className="relative" key={i}><CaseImage uri={uri} className="w-28 h-20 rounded-lg"/><button type="button" aria-label="Remove creative" onClick={() => setEditing(p => ({...p,creatives:p.creatives.filter((_,j)=>j!==i)}))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X size={12}/></button></div>)}
        <label className="flex items-center justify-center w-28 h-20 border border-dashed border-border rounded-lg cursor-pointer text-xs text-muted-foreground">Add visual<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => {upload(e.target.files?.[0],true);e.target.value='';}} /></label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs"><Switch checked={!!editing.shuffle_mode} onCheckedChange={v => setField('shuffle_mode',v)}/> Shuffle visuals on each fire</label>
    </div>}
  </div>;
}