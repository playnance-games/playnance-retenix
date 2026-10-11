import { base44 } from '@/api/base44Client';
import { derivePlayerStatus } from '@/lib/playerStatus';

export async function loadPlayersWithStatus() {
  const [players, settings] = await Promise.all([base44.entities.Player.list('-created_date',1000),base44.entities.Settings.list()]);
  return players.map(player=>({...player,...derivePlayerStatus(player,settings[0]||{})}));
}