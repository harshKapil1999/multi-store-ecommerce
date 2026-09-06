import { ImageResponse } from 'next/og';
export const alt = 'Crabtile — Find your next favourite';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() { return new ImageResponse(<div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',width:'100%',height:'100%',background:'#172b29',color:'#f5f4ef',padding:'70px'}}><div style={{fontSize:40,fontWeight:700}}>crabtile.</div><div style={{fontSize:88,fontWeight:600,lineHeight:1.1,maxWidth:900}}>Find your next favourite.</div><div style={{fontSize:24,color:'#c5d6b6'}}>Himachal Pradesh, India · shop.crabtile.com</div></div>,size); }
