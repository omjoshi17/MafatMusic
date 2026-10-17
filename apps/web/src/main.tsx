import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Home, Search, Library, Heart, ListMusic, Music2, Settings, Play, Pause, Volume2, Upload, Plus, Compass } from 'lucide-react';
import './styles.css';

type Track = { id:number; title:string; artist:string; album:string; duration:number; source?:string };
async function api<T>(url:string, options?:RequestInit):Promise<T> { return (await fetch(url, options)).json(); }

function App() {
  const [page,setPage] = useState('Home');
  const [tracks,setTracks] = useState<Track[]>([]);
  const [liked,setLiked] = useState<Track[]>([]);
  const [query,setQuery] = useState('');
  const [current,setCurrent] = useState<Track|null>(null);
  const [playing,setPlaying] = useState(false);
  const [volume,setVolume] = useState(.8);
  const [position,setPosition] = useState(0);
  const [duration,setDuration] = useState(0);
  const [queue,setQueue] = useState<Track[]>([]);
  const [queueIndex,setQueueIndex] = useState(-1);
  const [shuffle,setShuffle] = useState(false);
  const [repeat,setRepeat] = useState(false);
  const [playlists,setPlaylists] = useState<{id:number;name:string;description:string}[]>([]);
  const [artists,setArtists] = useState<{id:number;name:string;track_count:number}[]>([]);
  const [albums,setAlbums] = useState<{id:number;title:string;artist:string;track_count:number}[]>([]);
  const audio = useRef<HTMLAudioElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { api<{data:Track[]}>('/api/tracks').then(x=>setTracks(x.data)); api<{data:Track[]}>('/api/liked').then(x=>setLiked(x.data)); api<{data:{id:number;name:string;description:string}[]}>('/api/playlists').then(x=>setPlaylists(x.data)); api<{data:{id:number;name:string;track_count:number}[]}>('/api/artists').then(x=>setArtists(x.data)); api<{data:{id:number;title:string;artist:string;track_count:number}[]}>('/api/albums').then(x=>setAlbums(x.data)); }, []);
  useEffect(() => { if (audio.current && current) { audio.current.src=`/api/audio/${current.id}`; if (playing) audio.current.play().catch(()=>setPlaying(false)); } }, [current]);
  useEffect(() => { if (audio.current) audio.current.volume=volume; }, [volume]);

  const shown = useMemo(() => query ? tracks.filter(t => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(query.toLowerCase())) : tracks, [tracks,query]);
  const nav = [['Home',Home],['Search',Search],['Discover',Compass],['Your Library',Library],['Liked Songs',Heart],['Playlists',ListMusic],['Local Music',Upload],['Settings',Settings]] as const;
  const play = (track:Track, sourceQueue=shown) => { const index=sourceQueue.findIndex(x=>x.id===track.id); setQueue(sourceQueue); setQueueIndex(index); setCurrent(track); setPlaying(true); };
  const next = () => { if (!queue.length) return; const nextIndex=shuffle ? Math.floor(Math.random()*queue.length) : (queueIndex+1)%queue.length; setQueueIndex(nextIndex); setCurrent(queue[nextIndex]); setPlaying(true); };
  const previous = () => { if (!queue.length) return; if ((audio.current?.currentTime??0)>5) { if(audio.current) audio.current.currentTime=0; return; } const previousIndex=(queueIndex-1+queue.length)%queue.length; setQueueIndex(previousIndex); setCurrent(queue[previousIndex]); setPlaying(true); };
  const toggleLike = async (track:Track) => { const isLiked=liked.some(x=>x.id===track.id); await fetch(`/api/liked/${track.id}`,{method:isLiked?'DELETE':'POST'}); setLiked(isLiked?liked.filter(x=>x.id!==track.id):[track,...liked]); };
  const importFile = async (file:File) => { const response=await fetch('/api/library/import-upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':file.name,'X-Track-Title':file.name.replace(/\.[^/.]+$/,''),'X-Track-Artist':'Imported local music','X-Track-Album':'Local library'},body:file}); if(!response.ok)return; const result=await response.json(); setTracks(prev=>[{id:result.data.id,title:result.data.title,artist:result.data.artist,album:result.data.album,duration:0},...prev]); setPage('Your Library'); };
  const format = (value:number) => `${Math.floor(value/60)}:${Math.floor(value%60).toString().padStart(2,'0')}`;
  const chooseFile = () => fileInput.current?.click();
  const createPlaylist = async () => { const name=window.prompt('Playlist name'); if(!name?.trim())return; const result=await api<{data:{id:number;name:string;description:string}}>('/api/playlists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name.trim()})}); setPlaylists(prev=>[result.data,...prev]); setPage('Playlists'); };
  const trackList = page==='Liked Songs' ? liked : shown;

  return <div className="shell">
    <aside><div className="brand"><span className="brand-mark">♫</span><span>Mafat<span>Music</span></span></div><nav>{nav.map(([label,Icon])=><button className={page===label?'active':''} onClick={()=>setPage(label)} key={label}><Icon size={18}/>{label}</button>)}</nav><div className="sidebar-note"><Music2 size={18}/><p>Your music, your freedom.</p></div></aside>
    <main><header><div className="search"><Search size={18}/><input value={query} onChange={e=>{setQuery(e.target.value);setPage('Search')}} placeholder="Search tracks, artists, albums"/></div><button className="avatar">OM</button></header>
      <section className="content"><div className="eyebrow">{page==='Home'?'WELCOME BACK':'YOUR SPACE'}</div><h1>{page}</h1>
        {page==='Home'&&<div className="hero"><div><p className="eyebrow">LOCAL-FIRST LISTENING</p><h2>Find your next<br/><em>favorite sound.</em></h2><p>Import music you own and make your listening space yours.</p><button className="primary" onClick={chooseFile}><Upload size={17}/> Import music</button></div><div className="hero-orbit">♫</div></div>}
        {page==='Local Music'&&<div className="import-panel"><p>Choose an audio file you are authorized to use. MafatMusic copies it into the local library directory and never sends it to a third party.</p><button className="primary" onClick={chooseFile}><Upload size={17}/> Choose audio file</button></div>}
        {page==='Discover'&&<div className="discover"><div><h2 className="section-title">Artists in your library</h2><div className="catalog-grid">{artists.map(artist=><div className="catalog-card" key={artist.id}><div className="art">{artist.name[0]}</div><strong>{artist.name}</strong><span>{artist.track_count} {artist.track_count===1?'track':'tracks'}</span></div>)}</div></div><div><h2 className="section-title">Albums in your library</h2><div className="catalog-grid">{albums.map(album=><div className="catalog-card" key={album.id}><div className="art">{album.title[0]}</div><strong>{album.title}</strong><span>{album.artist||'Unknown artist'} · {album.track_count} tracks</span></div>)}</div></div></div>}
        <input ref={fileInput} hidden type="file" accept="audio/*" onChange={e=>e.target.files?.[0]&&importFile(e.target.files[0])}/>
        {page==='Search'&&query&&<h2 className="section-title">Results for “{query}”</h2>}{page==='Liked Songs'&&<h2 className="section-title">Your favorites</h2>}
        <div className="section-head"><h2>{page==='Home'?'Your library':page==='Search'?'Tracks':page}</h2>{page==='Playlists'&&<button className="ghost" onClick={createPlaylist}><Plus size={16}/> New playlist</button>}</div>
        {page==='Playlists'&&<div className="playlist-grid">{playlists.map(playlist=><button className="playlist-card" key={playlist.id} onClick={()=>setPage(`Playlist:${playlist.id}`)}><ListMusic size={22}/><strong>{playlist.name}</strong><span>{playlist.description||'A MafatMusic playlist'}</span></button>)}</div>}
        {trackList.length===0?<div className="empty"><Music2 size={36}/><h3>{page==='Local Music'?'Bring your music to life':'Nothing here yet'}</h3><p>Import an authorized local audio file to get started.</p></div>:<div className="tracks">{trackList.map((track,i)=><div className="track" key={track.id}><span className="track-number">{String(i+1).padStart(2,'0')}</span><div className="art">{track.title[0]}</div><div className="track-meta"><strong>{track.title}</strong><span>{track.artist} · {track.album}</span></div><button className="icon-button" aria-label="Like" onClick={()=>toggleLike(track)}><Heart size={17} fill={liked.some(x=>x.id===track.id)?'currentColor':'none'}/></button><button className="play-mini" onClick={()=>play(track,trackList)}><Play size={15} fill="currentColor"/></button></div>)}</div>}
      </section>
    </main>
    <footer><div className="now"><div className="art small">{current?.title?.[0]??'♫'}</div><div><strong>{current?.title??'Choose a track'}</strong><span>{current?.artist??'Your library is waiting'}</span></div></div><div className="controls"><div className="transport"><button className={shuffle?'transport active':''} onClick={()=>setShuffle(!shuffle)} aria-label="Shuffle">↝</button><button onClick={previous} aria-label="Previous">◀</button><button onClick={()=>{setPlaying(!playing);if(audio.current){playing?audio.current.pause():audio.current.play()}}} className="play-main" disabled={!current}>{playing?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}</button><button onClick={next} aria-label="Next">▶</button><button className={repeat?'transport active':''} onClick={()=>setRepeat(!repeat)} aria-label="Repeat">↻</button></div><div className="progress"><span>{format(position)}</span><input type="range" min="0" max={duration||1} value={position} onChange={e=>{const nextPosition=Number(e.target.value);setPosition(nextPosition);if(audio.current)audio.current.currentTime=nextPosition}}/><span>{format(duration)}</span></div></div><div className="volume"><Volume2 size={17}/><input type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></div><audio ref={audio} onTimeUpdate={()=>setPosition(audio.current?.currentTime??0)} onLoadedMetadata={()=>setDuration(audio.current?.duration??0)} onEnded={()=>{if(repeat){if(audio.current){audio.current.currentTime=0;audio.current.play()}}else next()}}/></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

