import { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import * as THREE from "three";

// ════════════════════════════════════════════════════
// THEME
// ════════════════════════════════════════════════════
const ThemeCtx = createContext();
const useTheme = () => useContext(ThemeCtx);

const LIGHT = {
  bg:"#f4f5f7",bg2:"#edeef1",bg3:"#ffffff",sf:"#ffffff",sfH:"#f8f9fb",
  bd:"rgba(0,0,0,0.07)",bdL:"rgba(0,0,0,0.04)",
  tx:"#3a3d45",td:"#8a8f9c",tb:"#1a1c22",
  ac:"#2d7be5",acL:"#e8f0fd",acT:"#1e5bb0",
  bl:"#2d7be5",blL:"#e8f0fd",
  am:"#c67d0a",amL:"#fef6e8",
  rd:"#d63031",rdL:"#fde8e8",
  sh:"0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)",
  shH:"0 2px 8px rgba(0,0,0,0.07), 0 10px 24px rgba(0,0,0,0.05)",
  canvas:"#e5e7eb",
};
const DARK = {
  bg:"#16181e",bg2:"#1c1f27",bg3:"#232730",sf:"#232730",sfH:"#2a2e38",
  bd:"rgba(255,255,255,0.14)",bdL:"rgba(255,255,255,0.07)",
  tx:"#d0d4e0",td:"#9ea3b2",tb:"#eceef6",
  ac:"#6aaeff",acL:"#1e3050",acT:"#5b9cf6",
  bl:"#6aaeff",blL:"#1e3050",
  am:"#f0b840",amL:"#382a10",
  rd:"#ff6b6b",rdL:"#3a1818",
  sh:"0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.2)",
  shH:"0 2px 8px rgba(0,0,0,0.3), 0 10px 24px rgba(0,0,0,0.25)",
  canvas:"#12141a",
};
const MN = "'DM Mono', 'IBM Plex Mono', monospace";
const SN = "'Inter', 'DM Sans', -apple-system, sans-serif";

// ════════════════════════════════════════════════════
// DATABASE (condensed)
// ════════════════════════════════════════════════════
const FRAME_TYPES = [
  {id:"true-x",name:"True-X",desc:"Equal arm angles · balanced",mc:4},
  {id:"stretched-x",name:"Stretched-X",desc:"Elongated fore-aft",mc:4},
  {id:"deadcat",name:"Deadcat",desc:"Clear camera FOV",mc:4},
  {id:"h-frame",name:"H-Frame",desc:"Max payload space",mc:4},
  {id:"plus",name:"Plus (+)",desc:"Cardinal axis layout",mc:4},
  {id:"v-shape",name:"V-Shape",desc:"Forward-swept aero",mc:4},
  {id:"hex",name:"Hex",desc:"6 motors · redundancy",mc:6},
  {id:"octo",name:"Octo",desc:"8 motors · max redundancy",mc:8},
  {id:"y6",name:"Y6 Coax",desc:"6 motors · 3 arms",mc:6},
  {id:"tri",name:"Tricopter",desc:"3 motors · servo tilt",mc:3},
  {id:"bi",name:"Bicopter",desc:"2 motors · experimental",mc:2},
];
const FRAME_MATERIALS = [
  {id:"cf",name:"Carbon Fiber",desc:"Light · stiff · industry standard",df:1.0,stiffness:0.98,color:0x40404e,colorL:0x28282e,cost:"$$$"},
  {id:"al",name:"Aluminum 6061",desc:"Durable · heavier · easy to machine",df:1.75,stiffness:0.92,color:0x8a8a98,colorL:0x9a9aa8,cost:"$$"},
  {id:"tpu",name:"3D Print (TPU)",desc:"Flexible · crash resistant · heaviest",df:1.4,stiffness:0.72,color:0x4a4a60,colorL:0x444455,cost:"$"},
  {id:"fg",name:"Fiberglass/FR4",desc:"Cheap · moderate weight · PCB-like",df:1.15,stiffness:0.82,color:0x486040,colorL:0x4a5a38,cost:"$"},
  {id:"ti",name:"Titanium",desc:"Strongest · heaviest · premium",df:2.8,stiffness:0.96,color:0x7878a0,colorL:0x888898,cost:"$$$$"},
];
const SIZES=[
  {id:"65mm",l:"65mm",mm:65,auw:25,cat:"whoop"},{id:"75mm",l:"75mm",mm:75,auw:35,cat:"whoop"},
  {id:"2in",l:'2"',mm:90,auw:60,cat:"micro"},{id:"3in",l:'3"',mm:140,auw:150,cat:"toothpick"},
  {id:"3.5in",l:'3.5"',mm:160,auw:200,cat:"cinewhoop"},{id:"4in",l:'4"',mm:180,auw:250,cat:"freestyle"},
  {id:"5in",l:'5"',mm:220,auw:550,cat:"freestyle"},{id:"6in",l:'6"',mm:260,auw:700,cat:"long-range"},
  {id:"7in",l:'7"',mm:300,auw:900,cat:"long-range"},{id:"8in",l:'8"',mm:340,auw:1200,cat:"cinelifter"},
  {id:"9in",l:'9"',mm:380,auw:1500,cat:"cinelifter"},{id:"10in",l:'10"',mm:420,auw:2000,cat:"heavy-lift"},
  {id:"12in",l:'12"',mm:500,auw:4000,cat:"heavy-lift"},{id:"13in",l:'13"+',mm:560,auw:6000,cat:"industrial"},
  {id:"15in",l:'15"+',mm:680,auw:10000,cat:"industrial"},
];
const FRAME_MATS=[
  {id:"cf",name:"Carbon Fiber",desc:"3K twill weave · stiff & light",wf:1.0,color:[0x1a1a1f,0x2a2a30],rough:0.35,metal:0.15},
  {id:"al",name:"Aluminum",desc:"6061-T6 · durable & repairable",wf:1.8,color:[0x8a8a90,0x9a9aa0],rough:0.25,metal:0.85},
  {id:"gf",name:"Glass Fiber",desc:"FR4/G10 · budget & flexible",wf:1.4,color:[0x3a5530,0x4a6540],rough:0.55,metal:0.05},
  {id:"abs",name:"ABS / 3D Print",desc:"Printed frame · prototyping",wf:1.3,color:[0x2a2a35,0x3a3a45],rough:0.7,metal:0.0},
  {id:"ti",name:"Titanium",desc:"Ti-6Al-4V · ultralight strength",wf:1.2,color:[0x606068,0x707078],rough:0.2,metal:0.9},
];
const MOTORS=[
  {id:"m1",b:"T-Motor",m:"F40 Pro IV",kv:1950,sz:"2306",vn:14.8,vx:25.2,ic:36,w:32,t:1550,e:7.2,mt:16,s:["5in"],p:29},
  {id:"m2",b:"T-Motor",m:"F60 Pro V",kv:1750,sz:"2207",vn:14.8,vx:25.2,ic:42,w:34,t:1750,e:7.0,mt:16,s:["5in","6in"],p:35},
  {id:"m3",b:"T-Motor",m:"Velox V3 2207",kv:1950,sz:"2207",vn:14.8,vx:25.2,ic:40,w:31,t:1680,e:7.1,mt:16,s:["5in"],p:27},
  {id:"m4",b:"T-Motor",m:"F1507 3800KV",kv:3800,sz:"1507",vn:11.1,vx:14.8,ic:18,w:14,t:620,e:6.5,mt:12,s:["3in","4in"],p:22},
  {id:"m5",b:"T-Motor",m:"U5 KV400",kv:400,sz:"3508",vn:22.2,vx:44.4,ic:25,w:112,t:3200,e:10.5,mt:19,s:["10in","12in","13in"],p:89},
  {id:"m6",b:"T-Motor",m:"U7 V2 KV280",kv:280,sz:"4910",vn:22.2,vx:44.4,ic:30,w:175,t:5000,e:11.5,mt:19,s:["12in","13in","15in"],p:149},
  {id:"m7",b:"T-Motor",m:"U8 Lite KV85",kv:85,sz:"8108",vn:44.4,vx:51.8,ic:55,w:280,t:9800,e:12.0,mt:25,s:["13in","15in"],p:229},
  {id:"m8",b:"T-Motor",m:"MN3508 KV380",kv:380,sz:"3508",vn:22.2,vx:25.2,ic:18,w:102,t:2400,e:10.0,mt:19,s:["9in","10in"],p:79},
  {id:"m10",b:"EMAX",m:"ECO II 2207",kv:1900,sz:"2207",vn:11.1,vx:22.2,ic:35,w:30,t:1420,e:7.5,mt:16,s:["5in"],p:16},
  {id:"m11",b:"EMAX",m:"ECO II 2306",kv:1700,sz:"2306",vn:14.8,vx:25.2,ic:33,w:32,t:1500,e:7.6,mt:16,s:["5in","6in"],p:18},
  {id:"m12",b:"EMAX",m:"TH1103 7000KV",kv:7000,sz:"1103",vn:3.7,vx:11.1,ic:8,w:4.5,t:180,e:5.0,mt:9,s:["65mm","75mm","2in"],p:12},
  {id:"m13",b:"iFlight",m:"XING2 2207",kv:1855,sz:"2207",vn:14.8,vx:25.2,ic:40,w:31.5,t:1640,e:7.1,mt:16,s:["5in"],p:22},
  {id:"m14",b:"iFlight",m:"XING2 2806.5",kv:1350,sz:"2806",vn:14.8,vx:25.2,ic:38,w:41,t:1850,e:8.2,mt:16,s:["6in","7in"],p:28},
  {id:"m15",b:"iFlight",m:"XING2 1404",kv:3800,sz:"1404",vn:11.1,vx:14.8,ic:12,w:8.5,t:400,e:6.2,mt:12,s:["3in","3.5in"],p:18},
  {id:"m16",b:"BrotherHobby",m:"Avenger 2812",kv:900,sz:"2812",vn:22.2,vx:25.2,ic:32,w:48,t:2100,e:8.5,mt:19,s:["7in","8in"],p:45},
  {id:"m17",b:"KDE Direct",m:"KDE4012XF-400",kv:400,sz:"4012",vn:22.2,vx:44.4,ic:30,w:142,t:4500,e:11.0,mt:19,s:["10in","12in","13in"],p:89},
  {id:"m18",b:"KDE Direct",m:"KDE5215XF-220",kv:220,sz:"5215",vn:22.2,vx:51.8,ic:35,w:210,t:6200,e:11.8,mt:19,s:["12in","13in","15in"],p:149},
  {id:"m19",b:"Hobbywing",m:"XRotor X8",kv:100,sz:"8108",vn:44.4,vx:51.8,ic:80,w:480,t:15300,e:12.0,mt:25,s:["13in","15in"],p:299},
  {id:"m20",b:"BetaFPV",m:"1404 3800KV",kv:3800,sz:"1404",vn:11.1,vx:14.8,ic:14,w:9,t:430,e:6.0,mt:12,s:["3in","4in"],p:14},
  {id:"m21",b:"BetaFPV",m:"1102 18000KV",kv:18000,sz:"1102",vn:3.7,vx:3.8,ic:5,w:3.2,t:62,e:4.2,mt:6.6,s:["65mm","75mm"],p:8},
  {id:"m22",b:"Axis Flying",m:"C207 1960KV",kv:1960,sz:"2207",vn:14.8,vx:25.2,ic:42,w:30,t:1700,e:7.3,mt:16,s:["5in"],p:24},
  {id:"m23",b:"GEPRC",m:"SPEEDX2 2207.5",kv:1960,sz:"2207",vn:14.8,vx:25.2,ic:38,w:30,t:1600,e:7.2,mt:16,s:["5in"],p:22},
  {id:"m24",b:"Lumenier",m:"ZIP 2207",kv:1750,sz:"2207",vn:14.8,vx:25.2,ic:36,w:30,t:1580,e:7.3,mt:16,s:["5in"],p:26},
  {id:"m25",b:"RCInPower",m:"GTS V2 2207",kv:1860,sz:"2207",vn:14.8,vx:25.2,ic:39,w:30,t:1650,e:7.4,mt:16,s:["5in"],p:20},
  {id:"m26",b:"SunnySky",m:"X2216 1250KV",kv:1250,sz:"2216",vn:11.1,vx:14.8,ic:20,w:58,t:900,e:8.0,mt:16,s:["6in","7in"],p:28},
  {id:"m27",b:"MAD",m:"M40 KV90",kv:90,sz:"4010",vn:44.4,vx:51.8,ic:45,w:350,t:12000,e:11.5,mt:25,s:["12in","13in","15in"],p:189},
  {id:"m28",b:"HappyModel",m:"EX0802",kv:19000,sz:"0802",vn:3.7,vx:3.8,ic:4,w:2.5,t:50,e:3.8,mt:6.6,s:["65mm"],p:6},
  {id:"m29",b:"iFlight",m:"XING2 3110",kv:900,sz:"3110",vn:22.2,vx:25.2,ic:35,w:68,t:2400,e:9.5,mt:19,s:["7in","8in","9in"],p:38},
  {id:"m30",b:"Scorpion",m:"SII-4020",kv:630,sz:"4020",vn:22.2,vx:44.4,ic:25,w:150,t:4000,e:10.5,mt:19,s:["10in","12in"],p:89},
  {id:"m31",b:"Hacker",m:"Q80-8M V2",kv:100,sz:"8020",vn:44.4,vx:51.8,ic:65,w:450,t:16000,e:12.2,mt:25,s:["13in","15in"],p:349},
];
const ESCS=[
  {id:"e1",b:"Hobbywing",m:"XRotor 60A 4in1",t:"4in1",vn:11.1,vx:25.2,cc:60,bc:80,fw:"BLHeli_32",pr:["DShot300","DShot600"],w:12,mt:"30.5",s:["5in","6in","7in"],p:45},
  {id:"e2",b:"T-Motor",m:"F55A Pro II",t:"4in1",vn:14.8,vx:25.2,cc:55,bc:65,fw:"BLHeli_32",pr:["DShot300","DShot600","DShot1200"],w:14,mt:"30.5",s:["5in","6in","7in"],p:55},
  {id:"e3",b:"iFlight",m:"BLITZ E80",t:"4in1",vn:14.8,vx:51.8,cc:80,bc:100,fw:"AM32",pr:["DShot300","DShot600","DShot1200"],w:18,mt:"30.5",s:["5in","6in","7in","8in"],p:65},
  {id:"e4",b:"SpeedyBee",m:"BLS 50A",t:"4in1",vn:11.1,vx:25.2,cc:50,bc:60,fw:"BLHeli_S",pr:["DShot300","DShot600"],w:8,mt:"30.5",s:["5in"],p:28},
  {id:"e5",b:"HGLRC",m:"Zeus 80A AM32",t:"4in1",vn:14.8,vx:51.8,cc:80,bc:100,fw:"AM32",pr:["DShot300","DShot600","DShot1200"],w:17,mt:"30.5",s:["5in","6in","7in","8in"],p:62},
  {id:"e6",b:"APD",m:"F Series 80F3",t:"single",vn:14.8,vx:51.8,cc:80,bc:120,fw:"APD",pr:["DShot600","PWM","CAN"],w:35,mt:"custom",s:["7in","8in","9in","10in","12in","13in"],p:149},
  {id:"e7",b:"KDE Direct",m:"UAS HVC 85A",t:"single",vn:22.2,vx:51.8,cc:85,bc:110,fw:"KDE",pr:["PWM","CAN"],w:65,mt:"custom",s:["10in","12in","13in","15in"],p:189},
  {id:"e8",b:"Castle",m:"Phoenix Edge 160",t:"single",vn:22.2,vx:50.4,cc:160,bc:200,fw:"Castle",pr:["PWM"],w:82,mt:"custom",s:["10in","12in","13in","15in"],p:249},
  {id:"e9",b:"BetaFPV",m:"12A Toothpick",t:"4in1",vn:7.4,vx:14.8,cc:12,bc:15,fw:"BLHeli_S",pr:["DShot300","DShot600"],w:3,mt:"16",s:["2in","3in"],p:19},
  {id:"e10",b:"Holybro",m:"Tekko32 45A",t:"4in1",vn:14.8,vx:25.2,cc:45,bc:55,fw:"BLHeli_32",pr:["DShot300","DShot600"],w:10,mt:"30.5",s:["5in","6in"],p:42},
  {id:"e11",b:"Diatone",m:"Mamba F50 Pro",t:"4in1",vn:14.8,vx:25.2,cc:50,bc:65,fw:"BLHeli_32",pr:["DShot300","DShot600"],w:11,mt:"30.5",s:["5in","6in"],p:38},
  {id:"e12",b:"BetaFPV",m:"F4 1S 5A AIO",t:"AIO",vn:3.7,vx:7.4,cc:5,bc:7,fw:"BLHeli_S",pr:["DShot300","DShot600"],w:2.8,mt:"25.5",s:["65mm","75mm","2in"],p:24},
  {id:"e13",b:"T-Motor",m:"ALPHA 60A HV",t:"single",vn:22.2,vx:51.8,cc:60,bc:80,fw:"T-Motor FOC",pr:["PWM","CAN","DShot600"],w:75,mt:"custom",s:["8in","9in","10in","12in","13in"],p:129},
  {id:"e14",b:"GEPRC",m:"TAKER G4 45A",t:"4in1",vn:14.8,vx:25.2,cc:45,bc:55,fw:"AM32",pr:["DShot300","DShot600"],w:10,mt:"30.5",s:["5in","6in"],p:38},
];
const FCS=[
  {id:"fc1",b:"SpeedyBee",m:"F405 V4",mcu:"STM32F405",imu:"ICM42688P",vn:7.4,vx:25.2,u:6,fw:["Betaflight","INAV","ArduPilot"],mt:"30.5",w:7,s:["5in","6in","7in"],p:35},
  {id:"fc2",b:"SpeedyBee",m:"F7 V3",mcu:"STM32F722",imu:"BMI270",vn:7.4,vx:25.2,u:7,fw:["Betaflight","INAV","ArduPilot"],mt:"30.5",w:9,s:["5in","6in","7in","8in"],p:48},
  {id:"fc3",b:"Holybro",m:"Pixhawk 6X",mcu:"STM32H753",imu:"ICM42688P×3",vn:14.8,vx:51.8,u:8,fw:["PX4","ArduPilot"],mt:"Pixhawk",w:52,s:["7in","8in","9in","10in","12in","13in","15in"],p:299},
  {id:"fc4",b:"CUAV",m:"Nora+",mcu:"STM32H743",imu:"ICM42688P×3",vn:14.8,vx:51.8,u:8,fw:["PX4","ArduPilot"],mt:"Pixhawk",w:48,s:["7in","8in","9in","10in","12in","13in","15in"],p:249},
  {id:"fc5",b:"CubePilot",m:"Cube Orange+",mcu:"STM32H757",imu:"ICM42688+ICM20948",vn:14.8,vx:51.8,u:8,fw:["ArduPilot","PX4"],mt:"Cube",w:75,s:["9in","10in","12in","13in","15in"],p:399},
  {id:"fc6",b:"iFlight",m:"Blitz F7 Pro",mcu:"STM32F722",imu:"BMI270",vn:7.4,vx:25.2,u:6,fw:["Betaflight","INAV"],mt:"30.5",w:8,s:["5in","6in","7in"],p:42},
  {id:"fc7",b:"Matek",m:"H743-SLIM V3",mcu:"STM32H743",imu:"ICM42688P",vn:7.4,vx:36,u:7,fw:["ArduPilot","INAV","Betaflight"],mt:"30.5",w:10,s:["5in","6in","7in","8in","9in"],p:65},
  {id:"fc8",b:"BetaFPV",m:"F4 1S AIO",mcu:"STM32F411",imu:"MPU6000",vn:3.7,vx:7.4,u:2,fw:["Betaflight"],mt:"25.5",w:3,s:["65mm","75mm","2in"],p:29},
  {id:"fc9",b:"HGLRC",m:"Zeus H743",mcu:"STM32H743",imu:"ICM42688P",vn:7.4,vx:36,u:7,fw:["Betaflight","INAV","ArduPilot"],mt:"30.5",w:10,s:["5in","6in","7in","8in"],p:58},
  {id:"fc10",b:"mRobotics",m:"Control Zero H7",mcu:"STM32H7",imu:"ICM20948",vn:14.8,vx:51.8,u:6,fw:["PX4","ArduPilot"],mt:"mRo",w:38,s:["7in","8in","9in","10in","12in","13in","15in"],p:299},
  {id:"fc11",b:"Diatone",m:"Mamba MK4 F722",mcu:"STM32F722",imu:"ICM42688P",vn:14.8,vx:25.2,u:6,fw:["Betaflight","INAV"],mt:"30.5",w:8,s:["5in","6in"],p:38},
  {id:"fc12",b:"Holybro",m:"Kakute H7 Mini",mcu:"STM32H743",imu:"BMI270",vn:7.4,vx:25.2,u:6,fw:["Betaflight","INAV"],mt:"20",w:6,s:["3in","3.5in","4in","5in"],p:45},
];
const BATTS=[
  {id:"b1",b:"Tattu",m:"R-Line V5 1550 6S",c:6,v:22.2,cap:1550,dr:150,w:218,cn:"XT60",ch:"LiPo",s:["5in"],p:49},
  {id:"b2",b:"Tattu",m:"R-Line V5 1300 6S",c:6,v:22.2,cap:1300,dr:150,w:195,cn:"XT60",ch:"LiPo",s:["5in"],p:44},
  {id:"b3",b:"CNHL",m:"Black 1500 6S",c:6,v:22.2,cap:1500,dr:100,w:210,cn:"XT60",ch:"LiPo",s:["5in"],p:38},
  {id:"b4",b:"GNB",m:"HV 660 4S",c:4,v:15.2,cap:660,dr:90,w:78,cn:"XT30",ch:"LiHV",s:["3in","4in"],p:22},
  {id:"b5",b:"GNB",m:"530 1S HV",c:1,v:3.8,cap:530,dr:90,w:14,cn:"BT2.0",ch:"LiHV",s:["65mm","75mm","2in"],p:8},
  {id:"b6",b:"Tattu",m:"Plus 16000 6S",c:6,v:22.2,cap:16000,dr:15,w:1950,cn:"AS150",ch:"LiPo",s:["10in","12in","13in"],p:289},
  {id:"b7",b:"Molicel",m:"P42A 6S Pack",c:6,v:21.6,cap:4200,dr:10,w:420,cn:"XT60",ch:"Li-Ion",s:["7in","8in","9in"],p:89},
  {id:"b8",b:"Tattu",m:"R-Line 1050 4S",c:4,v:14.8,cap:1050,dr:120,w:118,cn:"XT60",ch:"LiPo",s:["4in","5in"],p:32},
  {id:"b9",b:"Tattu",m:"Smart 30000 14S",c:14,v:51.8,cap:30000,dr:35,w:8200,cn:"ACES",ch:"LiPo",s:["13in","15in"],p:1299},
  {id:"b10",b:"MaxAmps",m:"22000 12S",c:12,v:44.4,cap:22000,dr:25,w:5200,cn:"EC5",ch:"LiPo",s:["12in","13in","15in"],p:699},
  {id:"b11",b:"CNHL",m:"10000 6S",c:6,v:22.2,cap:10000,dr:40,w:1280,cn:"XT90",ch:"LiPo",s:["8in","9in","10in"],p:149},
  {id:"b12",b:"GNB",m:"850 3S",c:3,v:11.1,cap:850,dr:75,w:65,cn:"XT30",ch:"LiPo",s:["3in","3.5in","4in"],p:18},
  {id:"b13",b:"Ovonic",m:"1550 6S",c:6,v:22.2,cap:1550,dr:100,w:228,cn:"XT60",ch:"LiPo",s:["5in","6in"],p:35},
  {id:"b14",b:"Ovonic",m:"1550 4S",c:4,v:14.8,cap:1550,dr:100,w:174,cn:"XT60",ch:"LiPo",s:["5in"],p:28},
  {id:"b15",b:"GNB",m:"1100 4S HV",c:4,v:15.2,cap:1100,dr:100,w:120,cn:"XT60",ch:"LiHV",s:["4in","5in"],p:24},
];
const PROPS=[
  {id:"p1",b:"HQProp",m:"5x4.3x3 V2S",bl:3,d:5,pi:4.3,w:4.5,s:["5in"],p:3},
  {id:"p2",b:"Gemfan",m:"51466 Hurricane",bl:3,d:5,pi:4.66,w:4.2,s:["5in"],p:3},
  {id:"p3",b:"Ethix",m:"S5 Light",bl:3,d:5,pi:4.0,w:3.8,s:["5in"],p:4},
  {id:"p4",b:"Gemfan",m:"3018 2-blade",bl:2,d:3,pi:1.8,w:1.2,s:["3in","3.5in"],p:2},
  {id:"p5",b:"Gemfan",m:"2015 2-blade",bl:2,d:2,pi:1.5,w:0.5,s:["2in","65mm","75mm"],p:2},
  {id:"p6",b:"HQProp",m:"4x3x3",bl:3,d:4,pi:3,w:2.8,s:["4in"],p:3},
  {id:"p7",b:"HQProp",m:"7x3.5x3",bl:3,d:7,pi:3.5,w:8.5,s:["7in"],p:5},
  {id:"p8",b:"Gemfan",m:"6030",bl:2,d:6,pi:3,w:5.0,s:["6in"],p:4},
  {id:"p9",b:"T-Motor",m:"P9x3 CF",bl:2,d:9,pi:3,w:12,s:["9in"],p:12},
  {id:"p10",b:"APC",m:"10x4.7 MR",bl:2,d:10,pi:4.7,w:15,s:["10in"],p:8},
  {id:"p11",b:"T-Motor",m:"G28x9.2 CF",bl:2,d:28,pi:9.2,w:45,s:["12in","13in"],p:35},
  {id:"p12",b:"T-Motor",m:"G40x13 CF",bl:2,d:40,pi:13.1,w:120,s:["15in"],p:65},
  {id:"p13",b:"T-Motor",m:"P8x3 CF",bl:2,d:8,pi:3,w:10,s:["8in"],p:14},
  {id:"p14",b:"DALPROP",m:"Cyclone T5045C",bl:3,d:5,pi:4.5,w:4.3,s:["5in"],p:4},
];
const VTXS=[
  {id:"v1",b:"TBS",m:"Unify Pro32 HV",sys:"Analog",pw:[25,200,500,800],lat:1,w:7,vn:7.4,vx:25.2,s:["5in","6in","7in","8in"],p:49},
  {id:"v2",b:"DJI",m:"O3 Air Unit",sys:"DJI",pw:[25,700],lat:14,w:21,vn:7.4,vx:25.2,s:["3.5in","4in","5in","6in","7in"],p:249},
  {id:"v3",b:"DJI",m:"O4 Air Unit",sys:"DJI",pw:[25,1000],lat:12,w:18,vn:7.4,vx:25.2,s:["3.5in","4in","5in","6in","7in","8in"],p:289},
  {id:"v4",b:"Walksnail",m:"Avatar HD V2",sys:"Walksnail",pw:[25,700,1200],lat:18,w:18,vn:7.4,vx:25.2,s:["4in","5in","6in","7in"],p:199},
  {id:"v5",b:"HDZero",m:"Race V3",sys:"HDZero",pw:[25,200,400],lat:4,w:6,vn:7.4,vx:25.2,s:["4in","5in","6in"],p:79},
  {id:"v6",b:"HDZero",m:"Freestyle V2",sys:"HDZero",pw:[25,200,500,1000],lat:4,w:9,vn:7.4,vx:25.2,s:["5in","6in","7in","8in"],p:99},
  {id:"v7",b:"Rush",m:"Tank Solo",sys:"Analog",pw:[25,200,400,800],lat:1,w:5,vn:7.4,vx:25.2,s:["5in","6in","7in"],p:29},
  {id:"v8",b:"HDZero",m:"Whoop Lite",sys:"HDZero",pw:[25,200],lat:4,w:3,vn:3.3,vx:7.4,s:["65mm","75mm","2in","3in"],p:59},
];
const CAMS=[
  {id:"c1",b:"RunCam",m:"Phoenix 2 Joshua",sys:"Analog",w:7,s:["4in","5in","6in","7in"],p:38},
  {id:"c2",b:"Foxeer",m:"Razer Mini",sys:"Analog",w:4,s:["3in","3.5in","4in","5in"],p:22},
  {id:"c3",b:"Caddx",m:"Ratel 2 V2",sys:"Analog",w:7,s:["4in","5in","6in","7in"],p:28},
  {id:"c4",b:"DJI",m:"O3 Camera",sys:"DJI",w:4,s:["3.5in","4in","5in","6in","7in"],p:149},
  {id:"c5",b:"DJI",m:"O4 Camera",sys:"DJI",w:4,s:["3.5in","4in","5in","6in","7in","8in"],p:199},
  {id:"c6",b:"RunCam",m:"HDZero Micro V3",sys:"HDZero",w:5,s:["4in","5in","6in","7in"],p:89},
  {id:"c7",b:"Caddx",m:"Polar Starlight",sys:"Walksnail",w:5,s:["4in","5in","6in","7in"],p:59},
  {id:"c8",b:"Caddx",m:"Ant Lite",sys:"Analog",w:2,s:["65mm","75mm","2in","3in"],p:15},
];
const RXS=[
  {id:"r1",b:"HappyModel",m:"EP2 TCXO",pr:"ELRS",fr:"2.4G",w:1.2,s:["65mm","75mm","2in","3in","3.5in","4in","5in","6in","7in"],p:14},
  {id:"r2",b:"RadioMaster",m:"RP1 ELRS",pr:"ELRS",fr:"2.4G",w:1.0,s:["65mm","75mm","2in","3in","3.5in","4in","5in","6in","7in"],p:12},
  {id:"r3",b:"TBS",m:"Crossfire Nano",pr:"CRSF",fr:"915MHz",w:2,s:["3in","3.5in","4in","5in","6in","7in"],p:29},
  {id:"r4",b:"FrSky",m:"R-XSR",pr:"SBUS",fr:"2.4G",w:1.5,s:["3in","3.5in","4in","5in","6in","7in"],p:22},
  {id:"r5",b:"RadioMaster",m:"RP4TD Diversity",pr:"ELRS",fr:"2.4G",w:3.5,s:["5in","6in","7in","8in","9in"],p:18},
  {id:"r6",b:"TBS",m:"Crossfire Diversity",pr:"CRSF",fr:"915MHz",w:8,s:["5in","6in","7in","8in","9in","10in"],p:49},
];
const GPSS=[
  {id:"g1",b:"Holybro",m:"M10 Standard",chip:"u-blox M10",w:20,s:["5in","6in","7in","8in","9in","10in","12in","13in"],p:35},
  {id:"g2",b:"Holybro",m:"H-RTK F9P",chip:"u-blox F9P",w:52,s:["7in","8in","9in","10in","12in","13in","15in"],p:249},
  {id:"g3",b:"Beitian",m:"BN-880",chip:"u-blox M8N",w:18,s:["5in","6in","7in","8in"],p:22},
  {id:"g4",b:"Matek",m:"M10Q-5883",chip:"u-blox M10",w:8,s:["4in","5in","6in","7in","8in"],p:28},
  {id:"g5",b:"CUAV",m:"C-RTK 9P",chip:"u-blox F9P",w:55,s:["9in","10in","12in","13in","15in"],p:289},
];

// ════════════════════════════════════════════════════
// COMPAT + FLIGHT
// ════════════════════════════════════════════════════
function checkCompat(sel,size,frame,frameMat){
  var e=[],w=[];var mc=frame?frame.mc:4;
  var motor=sel.motor,esc=sel.esc,fc=sel.fc,battery=sel.battery,prop=sel.prop,vtx=sel.vtx,camera=sel.camera;
  if(motor&&battery){if(battery.v<motor.vn)e.push({c:["motor","battery"],msg:"Battery "+battery.v+"V below motor min "+motor.vn+"V"});if(battery.v>motor.vx)e.push({c:["motor","battery"],msg:"Battery "+battery.v+"V exceeds motor max "+motor.vx+"V"});}
  if(esc&&battery){if(battery.v<esc.vn)e.push({c:["esc","battery"],msg:"Battery "+battery.v+"V below ESC min "+esc.vn+"V"});if(battery.v>esc.vx)e.push({c:["esc","battery"],msg:"Battery "+battery.v+"V exceeds ESC max "+esc.vx+"V"});}
  if(fc&&battery){if(battery.v>fc.vx)e.push({c:["fc","battery"],msg:"Battery "+battery.v+"V exceeds FC max "+fc.vx+"V"});if(battery.v<fc.vn)e.push({c:["fc","battery"],msg:"Battery "+battery.v+"V below FC min "+fc.vn+"V"});}
  if(motor&&esc){if(motor.ic>esc.cc*1.1)e.push({c:["motor","esc"],msg:"Motor "+motor.ic+"A > ESC "+esc.cc+"A"});else if(motor.ic>esc.cc*0.8)w.push({c:["motor","esc"],msg:"Motor "+motor.ic+"A near ESC "+esc.cc+"A limit"});}
  if(motor&&battery){var tA=motor.ic*mc,bA=(battery.cap/1000)*battery.dr;if(tA>bA)e.push({c:["motor","battery"],msg:"Total peak "+tA+"A > battery "+Math.round(bA)+"A"});else if(tA>bA*0.85)w.push({c:["motor","battery"],msg:"Total "+tA+"A near battery "+Math.round(bA)+"A"});}
  if(esc&&fc){var fcBF=fc.fw.some(function(f){return f==="Betaflight"||f==="INAV";});var hasDShot=esc.pr.some(function(p){return p.indexOf("DShot")===0;});
    if(fcBF&&!hasDShot)w.push({c:["esc","fc"],msg:"FC needs DShot but ESC lacks it"});
    if(esc.mt!=="custom"&&fc.mt!=="Pixhawk"&&fc.mt!=="Cube"&&fc.mt!=="mRo"&&esc.mt!==fc.mt)w.push({c:["esc","fc"],msg:"ESC "+esc.mt+"mm ≠ FC "+fc.mt+"mm mount"});}
  if(vtx&&camera){if(vtx.sys!==camera.sys)e.push({c:["vtx","camera"],msg:vtx.sys+" VTX ≠ "+camera.sys+" camera"});}
  if(motor&&size&&motor.s.indexOf(size.id)<0)w.push({c:["motor"],msg:motor.b+" "+motor.m+" atypical for "+size.l});
  if(esc&&size&&esc.s.indexOf(size.id)<0)w.push({c:["esc"],msg:esc.b+" "+esc.m+" atypical for "+size.l});
  if(fc&&size&&fc.s.indexOf(size.id)<0)w.push({c:["fc"],msg:fc.b+" "+fc.m+" atypical for "+size.l});
  if(motor&&battery){var mw2=motor.w*mc,ew2=esc?(esc.t==="4in1"?esc.w:esc.w*mc):20,fw2=fc?fc.w:8,pw2=prop?prop.w*mc:12;
    var frW2=(size?size.auw*0.25:100)*(frameMat?frameMat.df:1),auw2=mw2+ew2+fw2+pw2+battery.w+frW2+30;var twr2=(motor.t*mc)/auw2;
    if(twr2<2)e.push({c:["motor","battery"],msg:"T/W "+twr2.toFixed(1)+":1 below 2:1"});else if(twr2<3)w.push({c:["motor","battery"],msg:"T/W "+twr2.toFixed(1)+":1 marginal"});}
  return{errors:e,warnings:w};
}
// fcPos/escPos: "above"/"between"/"below" — independent positioning
function calcFlight(sel,size,frame,battPos,alt,fcPos,escPos,frameMat){
  var motor=sel.motor,battery=sel.battery,esc=sel.esc,fc=sel.fc,prop=sel.prop;
  if(!motor||!battery)return null;
  var mc=frame?frame.mc:4,isCoax=frame&&frame.id==="y6";
  var matDF=frameMat?frameMat.df:1.0;
  var mw=motor.w*mc,ew=esc?(esc.t==="4in1"?esc.w:esc.w*mc):20,fw=fc?fc.w:8,pw=prop?prop.w*mc:12;
  var frW=(size?size.auw*0.25:100)*matDF,auw=mw+ew+fw+pw+battery.w+frW+30;
  // FM adjustment from material stiffness (stiffer = less vibration = better efficiency)
  var matStiff=frameMat?frameMat.stiffness:0.98;
  // CG factor — each placement independently shifts CG
  var cgF=1.0;
  if(battPos==="top")cgF+=0.01;if(battPos==="bottom")cgF+=0.02;
  if(fcPos==="above")cgF+=0.005;if(fcPos==="below")cgF+=0.01;
  if(escPos==="above")cgF+=0.005;if(escPos==="below")cgF+=0.012;
  var rho=1.225*Math.pow(1-0.0065*(alt||0)/288.15,4.2561);
  var pD=prop?prop.d*0.0254:(size?size.mm/1000*0.5:0.127);
  var dA=Math.PI*Math.pow(pD/2,2);var eR=isCoax?mc*0.85:mc;
  var T2=(auw/1000)*9.81;var baseFM=prop&&prop.bl>=3?0.58:prop&&prop.bl===2?0.68:0.62;var FM=baseFM*matStiff;
  var Pi=Math.pow(T2,1.5)/Math.sqrt(2*rho*dA*eR);var Ph=(Pi/FM)*cgF;var Pe=Ph/(0.83*0.95);
  var Vs=battery.v*0.9,E=battery.v*(battery.cap/1000)*0.8,Ih=Pe/Vs;
  var k=battery.ch==="Li-Ion"?1.02:1.05,Ir=battery.cap/1000;
  var pf=Math.pow(Ir/Math.max(Ih,0.1),k-1);
  var ht=(E/Pe)*60*pf,ct=ht*0.72;
  var mxT=motor.t*(isCoax?mc*0.85:mc),twr=mxT/auw;
  return{auw:Math.round(auw),hoverTime:Math.round(ht*10)/10,cruiseTime:Math.round(ct*10)/10,
    hoverCurrent:Math.round(Ih*10)/10,hoverPower:Math.round(Pe),twr:Math.round(twr*10)/10,
    hoverThrottle:Math.min(95,Math.round((1/twr)*100)),
    breakdown:{motors:mw,esc:ew,fc:fw,props:pw,battery:battery.w,frame:Math.round(frW),misc:30},
    altitude:alt||0,rho:Math.round(rho*1000)/1000,FM:Math.round(FM*100)/100,matName:frameMat?frameMat.name:"Carbon Fiber"};
}
function getMathInsights(sel,size,frame,fcPos,escPos,frameMat){
  var ins=[];var mc=frame?frame.mc:4;var matDF=frameMat?frameMat.df:1.0;
  // Frame material insight
  if(frameMat&&size){
    var baseW=Math.round(size.auw*0.25);var adjW=Math.round(baseW*matDF);
    ins.push({label:"Frame Weight",value:adjW+"g",formula:baseW+"g base × "+matDF+" ("+frameMat.name+")",type:matDF<=1.0?"good":matDF<=1.5?"warn":"bad"});
    if(frameMat.stiffness<0.9)ins.push({label:"Vibration Penalty",value:"-"+Math.round((1-frameMat.stiffness)*100)+"%",formula:frameMat.name+" flex reduces prop efficiency (FM)",type:"warn"});
  }
  // Running current tally from selected electronics
  var totalIdleCurrent=0; // amps at hover
  var selectedCount=0;
  if(sel.fc){totalIdleCurrent+=0.3;selectedCount++;} // FC ~300mA
  if(sel.vtx){var maxPw=sel.vtx.pw[sel.vtx.pw.length-1];totalIdleCurrent+=maxPw/1000*0.2;selectedCount++;} // VTX current estimate
  if(sel.rx){totalIdleCurrent+=0.1;selectedCount++;} // RX ~100mA
  if(sel.gps){totalIdleCurrent+=0.08;selectedCount++;} // GPS ~80mA
  if(sel.camera){totalIdleCurrent+=0.15;selectedCount++;} // Camera ~150mA

  if(sel.motor){var tT=sel.motor.t*mc;
    ins.push({label:"Total Max Thrust",value:tT+"g",formula:sel.motor.t+"g × "+mc+" motors",type:"motor"});
    ins.push({label:"Motor Weight (all)",value:(sel.motor.w*mc)+"g",formula:sel.motor.w+"g × "+mc,type:"motor"});
    ins.push({label:"Peak Current (all motors)",value:(sel.motor.ic*mc)+"A",formula:sel.motor.ic+"A × "+mc,type:"motor"});
    if(sel.battery){var mw=sel.motor.w*mc,ew=sel.esc?(sel.esc.t==="4in1"?sel.esc.w:sel.esc.w*mc):20,fw=sel.fc?sel.fc.w:8,pw=sel.prop?sel.prop.w*mc:12;
      var frW=(size?size.auw*0.25:100)*matDF,auw=mw+ew+fw+pw+sel.battery.w+frW+30;var twr=tT/auw;
      ins.push({label:"Thrust-to-Weight",value:twr.toFixed(1)+":1",formula:tT+"g ÷ "+Math.round(auw)+"g",type:twr>=4?"good":twr>=2?"warn":"bad"});
      // Hover motor current estimate: at hover throttle, each motor draws ~25-35% of peak
      var hoverFrac=Math.min(0.95,1/twr);var hoverMotorA=sel.motor.ic*hoverFrac*0.65;
      var totalHoverA=hoverMotorA*mc+totalIdleCurrent;
      ins.push({label:"Est. Hover Current",value:totalHoverA.toFixed(1)+"A",formula:hoverMotorA.toFixed(1)+"A×"+mc+"m + "+totalIdleCurrent.toFixed(1)+"A electronics",type:totalHoverA<(sel.battery.cap/1000)*sel.battery.dr*0.3?"good":"warn"});
    }}
  if(sel.battery){
    var totalE=sel.battery.v*(sel.battery.cap/1000);var usableE=totalE*0.8;
    ins.push({label:"Total Energy",value:totalE.toFixed(1)+"Wh",formula:sel.battery.v+"V × "+(sel.battery.cap/1000).toFixed(1)+"Ah",type:"battery"});
    ins.push({label:"Usable Energy (80% DoD)",value:usableE.toFixed(1)+"Wh",formula:totalE.toFixed(1)+"Wh × 80%",type:"battery"});
    var maxA=(sel.battery.cap/1000)*sel.battery.dr;
    ins.push({label:"Max Discharge Rate",value:Math.round(maxA)+"A",formula:(sel.battery.cap/1000).toFixed(1)+"Ah × "+sel.battery.dr+"C",type:"battery"});
    if(sel.motor){
      var peakDraw=sel.motor.ic*mc;var dischargeUsed=(peakDraw/maxA*100).toFixed(0);
      ins.push({label:"Peak vs Max Discharge",value:dischargeUsed+"%",formula:peakDraw+"A ÷ "+Math.round(maxA)+"A",type:dischargeUsed<=75?"good":dischargeUsed<=90?"warn":"bad"});
    }
  }
  if(sel.esc&&sel.motor){var hr=((sel.esc.cc/sel.motor.ic)*100).toFixed(0);ins.push({label:"ESC Headroom",value:hr+"%",formula:sel.esc.cc+"A ÷ "+sel.motor.ic+"A",type:hr>=110?"good":hr>=80?"warn":"bad"});}
  if(sel.prop){var dA=Math.PI*Math.pow(sel.prop.d*0.0254/2,2);ins.push({label:"Disc Area/motor",value:(dA*10000).toFixed(1)+"cm²",formula:"π×("+(sel.prop.d*25.4/2).toFixed(1)+"mm)²",type:"prop"});}
  // Electronics current summary
  if(selectedCount>0&&sel.battery){
    ins.push({label:"Electronics Current",value:totalIdleCurrent.toFixed(2)+"A",formula:(sel.fc?"FC ":"")+(sel.vtx?"VTX ":"")+(sel.rx?"RX ":"")+(sel.gps?"GPS ":"")+(sel.camera?"CAM":""),type:"battery"});
  }
  // CG impact from positioning
  if(sel.motor&&sel.battery){
    var cgNote=[];
    if(fcPos!=="between")cgNote.push("FC "+fcPos);if(escPos!=="between")cgNote.push("ESC "+escPos);
    if(cgNote.length>0)ins.push({label:"CG Shift Penalty",value:"+"+((fcPos==="above"?0.5:fcPos==="below"?1.0:0)+(escPos==="above"?0.5:escPos==="below"?1.2:0)).toFixed(1)+"%",formula:cgNote.join(" + ")+" → higher hover power",type:"warn"});
  }
  return ins;
}
function rateComponent(item,type,sel,size,frame,frameMat){
  var ts={};for(var k in sel)ts[k]=sel[k];ts[type]=item;var c=checkCompat(ts,size,frame,frameMat);
  if(c.errors.length>0)return"red";if(c.warnings.length>0)return"amber";return"green";
}

// ════════════════════════════════════════════════════
// 3D — persistent camera via shared ref
// ════════════════════════════════════════════════════
function buildDroneScene(canvas,ft,ds,sel,bPos,isDark,fcPos,escPos,cameraState,frameMat){
  var W=canvas.clientWidth,H=canvas.clientHeight;
  var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(W,H);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=isDark?1.6:1.3;
  renderer.setClearColor(isDark?0x1b2235:0xe5e7eb,1);
  var scene=new THREE.Scene();var camera=new THREE.PerspectiveCamera(38,W/H,0.01,100);
  var defTheta=0.785,defPhi=1.1,defRadius=0.5;
  var sph=new THREE.Spherical(cameraState.radius||defRadius,cameraState.phi||defPhi,cameraState.theta||defTheta);
  var off=new THREE.Vector3().setFromSpherical(sph);
  camera.position.copy(off);camera.lookAt(0,-0.002,0);
  // Lighting — significantly brighter in dark mode so drone is clearly visible
  var hC=isDark?[0xddeeff,0x445577]:[0xffffff,0xdde0e6];
  scene.add(new THREE.HemisphereLight(hC[0],hC[1],isDark?1.2:0.7));
  var kl=new THREE.DirectionalLight(0xffffff,isDark?2.2:1.2);kl.position.set(2,3,2);scene.add(kl);
  var fl=new THREE.DirectionalLight(isDark?0xaaccff:0xaaccff,isDark?0.8:0.3);fl.position.set(-2,1,-1);scene.add(fl);
  var rl=new THREE.DirectionalLight(isDark?0x6699ff:0x88aacc,isDark?0.6:0.1);rl.position.set(0,-1,-3);scene.add(rl);
  var gA=isDark?0x2a3a5a:0xaaaaaa,gB=isDark?0x1e2d48:0xcccccc;
  var gh=new THREE.GridHelper(0.5,20,gA,gB);gh.position.y=-0.06;scene.add(gh);
  // Frame material color — lighter in dark mode so it reads against the background
  var frameColor=frameMat?(isDark?frameMat.color:frameMat.colorL):(isDark?0x44445a:0x2a2a30);
  var frameMetalness=frameMat&&(frameMat.id==="al"||frameMat.id==="ti")?0.8:isDark?0.3:0.2;
  var cM=new THREE.MeshStandardMaterial({color:frameColor,roughness:isDark?0.35:0.4,metalness:frameMetalness});
  var mM=new THREE.MeshStandardMaterial({color:isDark?0x707080:0x555560,roughness:0.25,metalness:0.85});
  var cuM=new THREE.MeshStandardMaterial({color:0xcc8833,roughness:0.4,metalness:0.8});
  var prM=new THREE.MeshStandardMaterial({color:isDark?0x556688:0x555555,roughness:0.3,transparent:true,opacity:isDark?0.75:0.65});
  var acC=isDark?0x70b8ff:0x2d7be5;
  var aM=new THREE.MeshStandardMaterial({color:acC,roughness:0.3,metalness:0.6,emissive:isDark?0x1a3a66:0x081530,emissiveIntensity:isDark?0.5:0.3});
  var drone=new THREE.Group();var sc=ds?ds.mm/220:1;var armL=0.1*sc;var mc=ft?ft.mc:4;
  // Determine if frame needs to be taller (components between plates need gap)
  var betweenCount=(fcPos==="between"?1:0)+(escPos==="between"?1:0);
  var baseGap=0.01+betweenCount*0.004; // base 10mm, +4mm per electronics board between plates
  // If battery is between plates, frame must expand to fit battery height
  var battBetweenH=0;
  if(bPos==="between"&&sel.battery){battBetweenH=0.012*Math.min(2,sel.battery.cap/1000)+0.004;} // battery height + clearance
  var standoffH=Math.max(baseGap,battBetweenH);
  function getMP(){var pos=[];if(!ft){for(var i=0;i<4;i++){var a=(i*90+45)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}return pos;}
    switch(ft.id){
      case"true-x":for(var i=0;i<4;i++){var a=(i*90+45)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}break;
      case"stretched-x":pos.push({x:-armL*0.6,z:-armL*0.8},{x:armL*0.6,z:-armL*0.8},{x:-armL*0.55,z:armL*0.83},{x:armL*0.55,z:armL*0.83});break;
      case"deadcat":pos.push({x:-armL*0.75,z:-armL*0.65},{x:armL*0.75,z:-armL*0.65},{x:-armL*0.45,z:armL*0.89},{x:armL*0.45,z:armL*0.89});break;
      case"h-frame":pos.push({x:-armL*0.55,z:-armL*0.8},{x:armL*0.55,z:-armL*0.8},{x:-armL*0.55,z:armL*0.8},{x:armL*0.55,z:armL*0.8});break;
      case"plus":pos.push({x:0,z:-armL},{x:armL,z:0},{x:0,z:armL},{x:-armL,z:0});break;
      case"v-shape":pos.push({x:-armL*0.85,z:-armL*0.52},{x:armL*0.85,z:-armL*0.52},{x:-armL*0.35,z:armL*0.94},{x:armL*0.35,z:armL*0.94});break;
      case"hex":for(var i=0;i<6;i++){var a=(i*60+30)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}break;
      case"octo":for(var i=0;i<8;i++){var a=(i*45+22.5)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}break;
      case"y6":for(var i=0;i<3;i++){var a=(i*120-90)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}for(var i=0;i<3;i++){var a=(i*120-90)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL,coax:true});}break;
      case"tri":for(var i=0;i<3;i++){var a=(i*120-90)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}break;
      case"bi":pos.push({x:-armL,z:0},{x:armL,z:0});break;
      default:for(var i=0;i<4;i++){var a=(i*90+45)*Math.PI/180;pos.push({x:Math.cos(a)*armL,z:Math.sin(a)*armL});}
    }return pos;}
  var mPos=getMP();var pW=0.036*sc,pD=0.044*sc;
  // Frame plates — top plate at y=0, bottom plate adapts to gap
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(pW,0.002,pD),cM));
  var bp=new THREE.Mesh(new THREE.BoxGeometry(pW*1.1,0.002,pD*1.1),cM);bp.position.y=-standoffH;drone.add(bp);
  for(var sx=-1;sx<=1;sx+=2)for(var sz=-1;sz<=1;sz+=2){var so=new THREE.Mesh(new THREE.CylinderGeometry(0.002,0.002,standoffH,8),mM);so.position.set(sx*pW*0.38,-standoffH/2,sz*pD*0.38);drone.add(so);}
  // Arms at mid-height of frame
  var armY=-standoffH/2;
  // Arms ALWAYS visible — they're part of the frame
  mPos.forEach(function(pos){if(pos.coax)return;var dx=pos.x,dz=pos.z,len=Math.sqrt(dx*dx+dz*dz);
    var arm=new THREE.Mesh(new THREE.BoxGeometry(len,0.003,0.004*sc),cM);arm.position.set(dx/2,armY,dz/2);arm.rotation.y=-Math.atan2(dz,dx);drone.add(arm);});
  // Motors + props — only when selected
  var propGrps=[];
  if(sel.motor){
  mPos.forEach(function(pos){var mg=new THREE.Group();mg.position.set(pos.x,pos.coax?armY-0.013:armY,pos.z);
    mg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008*sc,0.009*sc,0.006*sc,16),mM).translateY(0.003));
    mg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.006*sc,0.006*sc,0.005*sc,16),cuM).translateY(0.001));
    mg.add(new THREE.Mesh(new THREE.CylinderGeometry(0.001,0.001,0.012*sc,8),mM).translateY(0.006));
    if(sel.prop){var pd=new THREE.Mesh(new THREE.CylinderGeometry(0.035*sc,0.035*sc,0.001,32),prM);pd.position.y=0.008;mg.add(pd);propGrps.push(pd);
    var blC=sel.prop.bl;
    for(var b=0;b<blC;b++){var bl=new THREE.Mesh(new THREE.BoxGeometry(0.028*sc,0.0008,0.005*sc),new THREE.MeshStandardMaterial({color:isDark?0x444444:0x555555}));bl.position.y=0.008;bl.rotation.y=(b/blC)*Math.PI;mg.add(bl);propGrps.push(bl);}}
    drone.add(mg);});
  }
  // FC + ESC positioned independently
  var fcMat=new THREE.MeshStandardMaterial({color:isDark?0x1a3322:0x2a5533,roughness:0.6});
  var escMat=new THREE.MeshStandardMaterial({color:isDark?0x0a2816:0x1a4828,roughness:0.6});
  // FC position: above=on top plate, between=mid-gap, below=under bottom plate
  var fcY=fcPos==="above"?0.003:fcPos==="below"?(-standoffH-0.004):(-standoffH*0.4);
  // ESC position: same logic, offset slightly from FC if co-located
  var escY=escPos==="above"?0.003:escPos==="below"?(-standoffH-0.004):(-standoffH*0.6);
  // If both are in the same zone, offset to avoid overlap
  if(fcPos===escPos){if(fcPos==="above"){fcY=0.005;escY=0.001;}else if(fcPos==="below"){fcY=-standoffH-0.003;escY=-standoffH-0.007;}else{fcY=-standoffH*0.35;escY=-standoffH*0.65;}}
  if(sel.fc){var fb=new THREE.Mesh(new THREE.BoxGeometry(pW*0.7,0.002,pD*0.5),fcMat);fb.position.y=fcY;drone.add(fb);
    drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.005,0.002,0.005),new THREE.MeshStandardMaterial({color:0x111111})).translateY(fcY+0.002));}
  if(sel.esc){var eb=new THREE.Mesh(new THREE.BoxGeometry(pW*0.65,0.002,pD*0.45),escMat);eb.position.y=escY;drone.add(eb);
    for(var fi=0;fi<4;fi++){drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.003,0.002,0.004),new THREE.MeshStandardMaterial({color:0x222222})).translateX(-0.006+fi*0.004).translateY(escY+0.002).translateZ(0.005));}}
  // Optional components
  if(sel.battery){var bg=new THREE.Group();var bW2=0.028*sc*Math.min(2,sel.battery.c/3),bH=0.012*Math.min(2,sel.battery.cap/1000),bD2=0.02*sc;
    bg.add(new THREE.Mesh(new THREE.BoxGeometry(bW2,bH,bD2),new THREE.MeshStandardMaterial({color:isDark?0x222228:0x333338,roughness:0.5,metalness:0.3})));
    bg.add(new THREE.Mesh(new THREE.BoxGeometry(bW2*0.3,bH+0.001,bD2+0.001),new THREE.MeshStandardMaterial({color:0xcc3333,roughness:0.8})));
    bg.add(new THREE.Mesh(new THREE.BoxGeometry(0.005,0.005,0.004),new THREE.MeshStandardMaterial({color:0xeecc00})).translateZ(bD2/2+0.002));
    if(bPos==="top")bg.position.y=0.003+bH/2;
    else if(bPos==="bottom")bg.position.y=-standoffH-0.003-bH/2;
    else bg.position.y=-standoffH/2; // centered between plates
    drone.add(bg);}
  if(sel.gps){drone.add(new THREE.Mesh(new THREE.CylinderGeometry(0.002,0.002,0.03,8),mM).translateY(0.015).translateZ(-pD*0.6));
    drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.015,0.002,0.015),new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:0.8})).translateY(0.032).translateZ(-pD*0.6));}
  if(sel.vtx){drone.add(new THREE.Mesh(new THREE.CylinderGeometry(0.001,0.001,0.02,6),aM).translateY(0.012).translateZ(pD*0.4));}
  if(sel.camera){drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.01,0.01,0.008),new THREE.MeshStandardMaterial({color:0x111111})).translateY(-0.002).translateZ(-pD*0.55-0.005));
    var ln=new THREE.Mesh(new THREE.CylinderGeometry(0.003,0.004,0.004,12),new THREE.MeshStandardMaterial({color:0x333355,metalness:0.9}));ln.rotation.x=Math.PI/2;ln.position.set(0,-0.002,-pD*0.55-0.01);drone.add(ln);}
  drone.add(new THREE.Mesh(new THREE.CylinderGeometry(0,0.004,0.008,3),aM).rotateX(Math.PI/2).translateZ(-0.002).translateY(pD*0.55));
  scene.add(drone);
  // Orbit controls with persistent state
  var isDown=false,lX=0,lY=0,tDt=0,pDt2=0,sDt=1;
  var onD=function(ev){isDown=true;var p=ev.touches?ev.touches[0]:ev;lX=p.clientX;lY=p.clientY;};
  var onMv=function(ev){if(!isDown)return;ev.preventDefault();var p=ev.touches?ev.touches[0]:ev;tDt-=(p.clientX-lX)*0.005;pDt2-=(p.clientY-lY)*0.005;lX=p.clientX;lY=p.clientY;};
  var onU=function(){isDown=false;};
  var onWh=function(ev){ev.preventDefault();sDt*=(1+Math.sign(ev.deltaY)*0.03);};
  canvas.addEventListener("mousedown",onD);canvas.addEventListener("mousemove",onMv);canvas.addEventListener("mouseup",onU);canvas.addEventListener("mouseleave",onU);
  canvas.addEventListener("touchstart",onD,{passive:true});canvas.addEventListener("touchmove",onMv,{passive:false});canvas.addEventListener("touchend",onU);
  canvas.addEventListener("wheel",onWh,{passive:false});
  var fId;var anim=function(){fId=requestAnimationFrame(anim);
    sph.theta+=tDt;sph.phi+=pDt2;sph.phi=Math.max(0.15,Math.min(Math.PI-0.15,sph.phi));
    sph.radius*=sDt;sph.radius=Math.max(0.12,Math.min(1.5,sph.radius));
    tDt*=0.92;pDt2*=0.92;sDt=1+(sDt-1)*0.92;
    off.setFromSpherical(sph);camera.position.copy(off);camera.lookAt(0,-0.002,0);
    // Save camera state continuously
    cameraState.theta=sph.theta;cameraState.phi=sph.phi;cameraState.radius=sph.radius;
    propGrps.forEach(function(p,i){p.rotation.y+=(i%2===0?0.15:-0.15);});
    renderer.render(scene,camera);};
  anim();
  return function(){cancelAnimationFrame(fId);renderer.dispose();
    canvas.removeEventListener("mousedown",onD);canvas.removeEventListener("mousemove",onMv);canvas.removeEventListener("mouseup",onU);canvas.removeEventListener("mouseleave",onU);
    canvas.removeEventListener("touchstart",onD);canvas.removeEventListener("touchmove",onMv);canvas.removeEventListener("touchend",onU);canvas.removeEventListener("wheel",onWh);};
}
var UPSCH={motor:{req:["brand","model","kv","size","voltage_min","voltage_max","max_current","weight","thrust_max"],doc:"Stator dims e.g. 2207. Thrust in grams."},esc:{req:["brand","model","type","voltage_min","voltage_max","cont_current","firmware","protocols","weight"],doc:"Type: 4in1/single/AIO."},fc:{req:["brand","model","mcu","imu","voltage_min","voltage_max","uarts","firmware","mount","weight"],doc:"MCU: STM32 variant."},battery:{req:["brand","model","cells","voltage","capacity","discharge_c","weight","connector","chemistry"],doc:"Chemistry: LiPo/LiHV/Li-Ion."},prop:{req:["brand","model","blades","diameter","pitch","weight"],doc:"Inches."}};

// ════════════════════════════════════════════════════
// UI COMPONENTS
// ════════════════════════════════════════════════════
function DroneViewer({frameType,droneSize,selections,batteryPos,fcPos,escPos,frameMat}){
  var canvasRef=useRef(null);var cleanupRef=useRef(null);
  var cameraStateRef=useRef({theta:0.785,phi:1.1,radius:0.5});
  var T=useTheme();var isDark=T.mode==="dark";var t=T.t;
  useEffect(function(){
    if(!canvasRef.current||!frameType||!droneSize)return;
    if(cleanupRef.current)cleanupRef.current();
    cleanupRef.current=buildDroneScene(canvasRef.current,frameType,droneSize,selections,batteryPos,isDark,fcPos,escPos,cameraStateRef.current,frameMat);
    return function(){if(cleanupRef.current)cleanupRef.current();};
  },[frameType,droneSize,selections,batteryPos,isDark,fcPos,escPos,frameMat]);
  return(
    <div style={{position:"relative",width:"100%",aspectRatio:"4/3",background:isDark?"#1b2235":t.canvas,borderRadius:16,overflow:"hidden",boxShadow:t.sh}}>
      <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",cursor:"grab"}}/>
      <div style={{position:"absolute",bottom:10,left:14,fontSize:9,color:t.td,fontFamily:MN,letterSpacing:0.8,opacity:0.6}}>Drag · Scroll to zoom</div>
      {frameType&&droneSize&&<div style={{position:"absolute",top:10,left:14,fontSize:10,color:t.ac,fontFamily:MN,fontWeight:600}}>{frameType.name} · {droneSize.l}{frameMat?" · "+frameMat.name:""}</div>}
    </div>);
}
function CompCard({item,type,onSelect,selected,rating}){
  var T=useTheme();var t=T.t;
  var ratingColor=rating==="red"?t.rd:rating==="amber"?t.am:t.ac;
  var ratingBg=rating==="red"?t.rdL:rating==="amber"?t.amL:t.acL;
  var bc=selected?ratingColor:(rating==="red"?t.rd+"88":rating==="amber"?t.am+"88":t.ac+"44");
  var bw=selected?"2.5px":"2px";
  var bg=selected?ratingBg:t.sf;
  var label=type==="motor"?item.kv+"KV · "+item.sz+" · "+item.w+"g · "+item.t+"g thrust"
    :type==="esc"?item.cc+"A cont · "+item.fw+" · "+item.vn+"–"+item.vx+"V"
    :type==="fc"?item.mcu+" · "+item.fw.join("/")+" · "+item.w+"g"
    :type==="battery"?item.c+"S "+item.v+"V · "+item.cap+"mAh · "+item.dr+"C"
    :type==="prop"?item.d+"\" "+item.bl+"-blade · "+item.w+"g"
    :type==="vtx"?item.sys+" · "+item.pw.join("/")+"mW"
    :type==="camera"?item.sys+" · "+item.w+"g"
    :type==="rx"?item.pr+" "+item.fr+" · "+item.w+"g"
    :type==="gps"?item.chip+" · "+item.w+"g":"";
  return(<div onClick={function(){onSelect(item);}} style={{border:bw+" solid "+bc,background:bg,borderRadius:10,padding:"12px 14px",cursor:"pointer",marginBottom:6,transition:"all 0.15s",position:"relative",boxShadow:selected?t.sh:"none"}}>
    <div style={{position:"absolute",top:10,right:10,width:9,height:9,borderRadius:"50%",background:ratingColor,opacity:selected?1:0.7,flexShrink:0}}/>
    <div style={{fontSize:14,fontWeight:600,color:t.tb,fontFamily:SN,paddingRight:16}}>{item.b} <span style={{color:t.ac,fontWeight:700}}>{item.m}</span></div>
    <div style={{fontSize:12,color:t.td,marginTop:4,fontFamily:MN,lineHeight:1.5}}>{label}</div>
  </div>);
}
// Definitions for physics line items
var PHYSICS_DEFS={
  "Frame Weight":"Estimated frame mass based on size class and material density. Carbon fiber is the baseline (1.0×). Aluminum is ~1.75× heavier, titanium ~2.8×, TPU ~1.4×.",
  "Vibration Penalty":"Flexible frame materials (TPU, fiberglass) allow structural vibration that reduces propeller efficiency. This lowers the figure of merit (FM) in the momentum-theory power calculation.",
  "Total Max Thrust":"Maximum combined thrust from all motors at full throttle. Must exceed AUW for flight; 2:1 ratio is the bare minimum for controlled hover.",
  "Motor Weight (all)":"Combined mass of all motors. Typically 20-30% of total AUW on a well-built 5\" quad.",
  "Peak Current (all motors)":"Total amperage all motors draw simultaneously at 100% throttle. Your battery and ESCs must handle this.",
  "Thrust-to-Weight":"Total thrust divided by all-up weight. Below 2:1 can't fly safely. 3-4:1 is good for freestyle. 5+:1 is racing territory.",
  "Est. Hover Current":"Estimated current draw at hover throttle — includes motor current at hover + combined electronics draw (FC, VTX, RX, GPS, camera).",
  "Total Energy":"Raw energy stored in the battery pack: voltage × capacity. Not all of this is usable.",
  "Usable Energy (80% DoD)":"Energy available after applying 80% depth-of-discharge limit. Discharging LiPo below 3.5V/cell causes permanent damage.",
  "Max Discharge Rate":"Maximum safe continuous current the battery can deliver, calculated from its C-rating × capacity.",
  "Peak vs Max Discharge":"What percentage of the battery's max discharge rate is consumed at full throttle. Below 75% is safe, above 90% risks voltage sag and puffing.",
  "ESC Headroom":"How much current capacity the ESC has relative to motor peak draw. Above 110% is safe margin; below 80% risks ESC overheating or failure.",
  "Disc Area/motor":"Propeller swept area per motor. Larger disc area = more efficient hover (lower disc loading). Momentum theory: P ∝ T^1.5 / √(ρ·A).",
  "Electronics Current":"Combined idle current draw from all selected electronic components (FC, VTX, receiver, GPS, camera) at typical operating voltage.",
  "CG Shift Penalty":"Moving FC or ESC away from the frame center shifts the center of gravity, requiring trim corrections that increase hover power consumption."
};

// ════════════════════════════════════════════════════
// BUY LINKS & REGION DETECTION
// ════════════════════════════════════════════════════
function detectRegion(lat,lon){
  // India
  if(lat>6&&lat<37&&lon>67&&lon<98)return"in";
  // UK (before broader EU check)
  if(lat>49.5&&lat<61&&lon>-8&&lon<2)return"uk";
  // Europe
  if(lat>34&&lat<72&&lon>-25&&lon<45)return"eu";
  // Australia / NZ
  if(lat>-47&&lat<-10&&lon>112&&lon<180)return"au";
  // Canada
  if(lat>42&&lat<84&&lon>-141&&lon<-52)return"ca";
  // Default US / international
  return"us";
}
function getBuyUrl(brand,model,region){
  var q=encodeURIComponent(brand+" "+model);
  if(region==="in")return"https://www.amazon.in/s?k="+q+"&i=electronics";
  if(region==="uk")return"https://www.amazon.co.uk/s?k="+q+"&i=electronics";
  if(region==="eu")return"https://www.banggood.com/search/"+encodeURIComponent(brand+"-"+model)+".html";
  if(region==="au")return"https://www.amazon.com.au/s?k="+q;
  if(region==="ca")return"https://www.amazon.ca/s?k="+q+"&i=electronics";
  return"https://www.getfpv.com/search?q="+q;
}
var REGION_LABELS={"us":"GetFPV (US)","uk":"Amazon UK","eu":"Banggood (EU)","in":"Amazon India","au":"Amazon AU","ca":"Amazon CA"};
var REGION_FLAGS={"us":"🇺🇸","uk":"🇬🇧","eu":"🇪🇺","in":"🇮🇳","au":"🇦🇺","ca":"🇨🇦"};

// ════════════════════════════════════════════════════
// BUILD SUMMARY PAGE
// ════════════════════════════════════════════════════
function BuildSummaryPage({build,onBack,onBackToBuilder}){
  var T=useTheme();var t=T.t;var isDark=T.mode==="dark";
  var rs=useState("us"),region=rs[0],setRegion=rs[1];
  var ls=useState("idle"),locState=ls[0],setLocState=ls[1];

  useEffect(function(){
    if(!navigator.geolocation){setLocState("denied");return;}
    setLocState("asking");
    navigator.geolocation.getCurrentPosition(
      function(pos){
        var r=detectRegion(pos.coords.latitude,pos.coords.longitude);
        setRegion(r);setLocState("granted");
      },
      function(){
        // Fallback: guess from browser language
        var lang=(navigator.language||"en-US").toLowerCase();
        if(lang.includes("en-in")||lang.includes("hi"))setRegion("in");
        else if(lang.includes("en-gb"))setRegion("uk");
        else if(lang.includes("en-au"))setRegion("au");
        else if(lang.includes("en-ca"))setRegion("ca");
        setLocState("denied");
      },
      {timeout:8000}
    );
  },[]);

  var mc=build.frame?build.frame.mc:4;
  var sel=build.sel||{};
  var COMP_TYPES=[
    {key:"motor",label:"Motor",qty:mc,unitKey:"p"},
    {key:"esc",label:"Speed Controller",qty:1,unitKey:"p"},
    {key:"fc",label:"Flight Controller",qty:1,unitKey:"p"},
    {key:"battery",label:"Battery",qty:1,unitKey:"p"},
    {key:"prop",label:"Propeller",qty:mc,unitKey:"p"},
    {key:"vtx",label:"Video Transmitter",qty:1,unitKey:"p"},
    {key:"camera",label:"Camera",qty:1,unitKey:"p"},
    {key:"rx",label:"Receiver",qty:1,unitKey:"p"},
    {key:"gps",label:"GPS Module",qty:1,unitKey:"p"},
  ];
  var rows=COMP_TYPES.filter(function(ct){return sel[ct.key];}).map(function(ct){
    var item=sel[ct.key];
    var unitPrice=item.p||0;
    var total=unitPrice*ct.qty;
    return{ct:ct,item:item,unitPrice:unitPrice,total:total};
  });
  var grandTotal=rows.reduce(function(s,r){return s+r.total;},0);

  return(<div style={{minHeight:"100vh",background:t.bg,color:t.tx,fontFamily:SN}}>
    {/* Header */}
    <div style={{padding:"14px 28px",borderBottom:"1px solid "+t.bd,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.bg+"e6",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
      <div style={{fontFamily:MN,fontWeight:700,fontSize:15,letterSpacing:1.2}}><span style={{color:t.tb}}>Multirotor</span><span style={{color:t.ac}}>.</span><span style={{color:t.tb}}>build</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={onBackToBuilder} style={{background:t.sf,border:"1px solid "+t.bd,color:t.td,padding:"7px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:SN,fontWeight:500}}>← Back to Builder</button>
        <button onClick={function(){T.toggle();}} style={{background:isDark?"#3a4055":t.sf,border:"2px solid "+(isDark?"#6aaeff":t.bd),borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,color:isDark?"#eceef6":t.td,fontWeight:600}}>{isDark?"☀ Light":"☾ Dark"}</button>
      </div>
    </div>

    <div style={{maxWidth:900,margin:"0 auto",padding:"32px 24px"}}>
      {/* Build title */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,color:t.ac,letterSpacing:1.5,fontFamily:MN,marginBottom:8}}>BUILD SUMMARY</div>
        <h1 style={{fontSize:28,fontWeight:800,color:t.tb,margin:"0 0 6px",fontFamily:SN}}>{build.name||"My Build"}</h1>
        <div style={{fontSize:14,color:t.td,fontFamily:SN}}>
          {build.frame&&build.frame.name} · {build.size&&build.size.l} · {build.frameMat&&build.frameMat.name}
          {build.flight&&<span> · {build.flight.hoverTime} min hover · {build.flight.auw}g AUW</span>}
        </div>
      </div>

      {/* Location / region selector */}
      <div style={{background:t.sf,borderRadius:14,padding:"14px 18px",marginBottom:24,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",boxShadow:t.sh}}>
        <div style={{fontSize:18}}>{REGION_FLAGS[region]||"🌍"}</div>
        <div style={{flex:1,minWidth:180}}>
          <div style={{fontSize:13,fontWeight:700,color:t.tb,fontFamily:SN}}>
            {locState==="asking"?"Detecting your location…":locState==="granted"?"Location detected — showing prices for your region":"Showing prices for: "+REGION_LABELS[region]}
          </div>
          <div style={{fontSize:11,color:t.td,marginTop:2,fontFamily:SN}}>
            {locState==="denied"?"Location permission denied — select your region manually below":"Buy links route to the cheapest major retailer in your region"}
          </div>
        </div>
        <select value={region} onChange={function(e){setRegion(e.target.value);}} style={{padding:"8px 12px",borderRadius:9,border:"1.5px solid "+t.bd,background:t.bg2,color:t.tb,fontSize:13,fontFamily:SN,cursor:"pointer",fontWeight:600}}>
          <option value="us">🇺🇸 United States</option>
          <option value="uk">🇬🇧 United Kingdom</option>
          <option value="eu">🇪🇺 Europe</option>
          <option value="in">🇮🇳 India</option>
          <option value="au">🇦🇺 Australia</option>
          <option value="ca">🇨🇦 Canada</option>
        </select>
      </div>

      {/* Component list */}
      <div style={{background:t.sf,borderRadius:16,boxShadow:t.sh,overflow:"hidden",marginBottom:24}}>
        {/* Table header */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 80px 100px 130px",gap:0,padding:"12px 20px",background:t.bg2,borderBottom:"1px solid "+t.bd}}>
          {["Component","Specs","Qty","Unit Price","Total",""].map(function(h,i){
            return <div key={i} style={{fontSize:11,fontWeight:700,color:t.td,fontFamily:SN,letterSpacing:0.5,textAlign:i>=2?"right":undefined,paddingRight:i>=2&&i<5?8:0}}>{h}</div>;
          })}
        </div>
        {rows.length===0&&<div style={{padding:"40px 20px",textAlign:"center",fontSize:14,color:t.td,fontFamily:SN}}>No components selected. Go back to the builder to select components.</div>}
        {rows.map(function(r,i){
          var url=getBuyUrl(r.item.b,r.item.m,region);
          return <div key={r.item.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 80px 80px 100px 130px",gap:0,padding:"16px 20px",borderBottom:i<rows.length-1?"1px solid "+t.bdL:"none",alignItems:"center",background:i%2===0?t.sf:t.bg+"44"}}>
            {/* Name */}
            <div>
              <div style={{fontSize:11,fontWeight:600,color:t.ac,letterSpacing:1,fontFamily:MN,marginBottom:3}}>{r.ct.label.toUpperCase()}</div>
              <div style={{fontSize:15,fontWeight:700,color:t.tb,fontFamily:SN}}>{r.item.b} <span style={{color:t.ac}}>{r.item.m}</span></div>
            </div>
            {/* Specs */}
            <div style={{fontSize:11,color:t.td,fontFamily:MN,lineHeight:1.5}}>
              {r.ct.key==="motor"&&<>{r.item.kv}KV · {r.item.sz}<br/>{r.item.w}g · {r.item.t}g thrust</>}
              {r.ct.key==="esc"&&<>{r.item.cc}A · {r.item.fw}<br/>{r.item.vn}–{r.item.vx}V</>}
              {r.ct.key==="fc"&&<>{r.item.mcu}<br/>{r.item.fw.join("/")}</>}
              {r.ct.key==="battery"&&<>{r.item.c}S {r.item.v}V<br/>{r.item.cap}mAh · {r.item.dr}C</>}
              {r.ct.key==="prop"&&<>{r.item.d}" {r.item.bl}-blade<br/>pitch {r.item.pi}"</>}
              {r.ct.key==="vtx"&&<>{r.item.sys}<br/>{r.item.pw.join("/")}mW</>}
              {r.ct.key==="camera"&&<>{r.item.sys} · {r.item.w}g</>}
              {r.ct.key==="rx"&&<>{r.item.pr} · {r.item.fr}</>}
              {r.ct.key==="gps"&&<>{r.item.chip}<br/>{r.item.w}g</>}
            </div>
            {/* Qty */}
            <div style={{fontSize:14,fontWeight:600,color:t.tb,textAlign:"right",paddingRight:8}}>{r.ct.qty}×</div>
            {/* Unit price */}
            <div style={{fontSize:14,fontWeight:600,color:t.td,textAlign:"right",paddingRight:8}}>{r.unitPrice>0?"$"+r.unitPrice:"—"}</div>
            {/* Total */}
            <div style={{fontSize:15,fontWeight:700,color:t.tb,textAlign:"right",paddingRight:8}}>{r.total>0?"$"+r.total:"—"}</div>
            {/* Buy button */}
            <div style={{textAlign:"right"}}>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",padding:"7px 14px",borderRadius:8,background:t.acL,color:t.ac,fontSize:12,fontWeight:700,fontFamily:SN,textDecoration:"none",border:"1px solid "+t.ac+"66",transition:"all 0.15s"}}
                onMouseEnter={function(e){e.currentTarget.style.background=t.ac;e.currentTarget.style.color="#fff";}}
                onMouseLeave={function(e){e.currentTarget.style.background=t.acL;e.currentTarget.style.color=t.ac;}}>
                Buy {REGION_FLAGS[region]}
              </a>
            </div>
          </div>;
        })}
      </div>

      {/* Total cost */}
      {grandTotal>0&&<div style={{background:isDark?"#1e2a40":t.acL,borderRadius:16,padding:"20px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:t.sh,border:"2px solid "+t.ac+"44",marginBottom:24}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:t.ac,letterSpacing:1.2,fontFamily:MN,marginBottom:4}}>ESTIMATED TOTAL COST</div>
          <div style={{fontSize:12,color:t.td,fontFamily:SN}}>
            Prices are approximate ({REGION_LABELS[region]}). Check each retailer for current pricing, shipping, and taxes.
            {build.frame&&<span> Frame not included — prices vary widely.</span>}
          </div>
        </div>
        <div style={{fontSize:36,fontWeight:800,color:t.ac,fontFamily:SN,whiteSpace:"nowrap",marginLeft:24}}>
          ${grandTotal.toLocaleString()}
        </div>
      </div>}

      {/* Note */}
      <div style={{background:t.bg2,borderRadius:12,padding:"14px 18px",fontSize:12,color:t.td,fontFamily:SN,lineHeight:1.7,border:"1px solid "+t.bd}}>
        <strong style={{color:t.tb,fontWeight:700}}>Note on pricing:</strong> Prices shown are USD estimates based on typical market rates and are updated periodically.
        Actual prices vary by region, stock availability, and promotions. The "Buy" button links to a product search on {REGION_LABELS[region]} —
        always verify the correct model before purchasing. For motors, the price shown is per motor × quantity ({build.frame?build.frame.mc:4} motors for this build).
      </div>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════
// DOCUMENTATION
// ════════════════════════════════════════════════════
const DOCS = [
  {section:"Components",items:[
    {title:"Frame",body:`The structural skeleton of the multirotor. It determines the motor count, arm geometry, and maximum component size that can be mounted.\n\n• True-X / Stretched-X: Most common freestyle and racing layouts. Arms at equal (True-X) or elongated (Stretched-X) angles for better front-camera clearance.\n• Deadcat: Front arms swept forward so props stay out of the camera field of view.\n• H-Frame: Two parallel beams — maximises space between plates for electronics.\n• Hex / Octo: 6 or 8 motors give mechanical redundancy — one motor failure is survivable.\n• Y6 Coax: 3 arms each carrying two coaxial counter-rotating motors; compact but slightly less efficient than flat hexes.\n\nMaterial matters:\n• Carbon Fibre (CF): Highest stiffness-to-weight ratio. Baseline density factor 1.0×.\n• Aluminium 6061: Durable and easy to repair but ~1.75× heavier.\n• Fiberglass/FR4: Budget option; absorbs vibration but heavier and less stiff.\n• TPU / 3D Print: Crash-resistant flex; heaviest, lowest stiffness — loses propeller efficiency.\n• Titanium: Stronger than aluminium at a lower weight penalty (~1.2× over CF) but extremely expensive.`},
    {title:"Motor",body:`Brushless DC motors are rated by:\n\n• Stator size (e.g. 2207): first two digits = stator diameter in mm, last two = stator height. Larger stator = more torque at lower KV.\n• KV rating: RPM the motor spins per volt of input with no load. Lower KV = more torque, suitable for larger props. Higher KV = higher RPM, used with smaller props.\n  Formula: RPM = KV × Voltage\n• Max continuous current (A): The sustained amperage the motor can handle without overheating.\n• Peak thrust (g): Maximum thrust at full throttle with a compatible propeller.\n• Efficiency (g/W): Grams of thrust produced per watt consumed — higher is better for endurance.\n\nCommon pairings:\n• 2306/2207 @ ~1900 KV + 6S → freestyle 5"\n• 1507 @ 3800 KV + 4S → micro 3–4"\n• 3508 @ 380 KV + 6S → long-range 9–10"\n• 4910 @ 280 KV + 12S → heavy-lift 12"+`},
    {title:"Electronic Speed Controller (ESC)",body:`The ESC converts the flight controller's digital commands into variable voltage/current to spin each motor at the commanded speed.\n\n• 4-in-1 ESC: Four ESCs on a single PCB, saves weight and wiring — standard for racing/freestyle.\n• Single ESC: One board per motor; heavier overall but easier to replace individually. Common on large platforms.\n• AIO (All-in-One): ESC + FC combined on one board; used on micro whoops for minimum weight.\n\nKey specs:\n• Continuous current (A): The rating the ESC can sustain indefinitely.\n• Burst current (A): Short-peak rating (typically 2–5 seconds).\n• Firmware: BLHeli_32, AM32, or BLHeli_S determine available protocols and features.\n\nProtocols:\n• PWM: Analogue signal; legacy — 50 Hz update rate.\n• DShot300/600/1200: Digital protocol; number = bit-rate in kbps. Higher = faster response.\n  DShot300 safe to ~8 kHz loop; DShot600 for 16 kHz+ loops.\n• CAN bus: Used on professional/enterprise platforms for reliability and telemetry.\n• OneShot / Multishot: Transitional digital-ish protocols, largely superseded by DShot.`},
    {title:"Flight Controller (FC)",body:`The brain of the drone. Reads IMU sensors, runs the PID control algorithm, and outputs motor commands many thousands of times per second.\n\n• MCU (Micro-Controller Unit): Determines processing power.\n  STM32F411 → entry level, up to ~4 kHz PID loop.\n  STM32F722/F745 → mid-range, 8–32 kHz loops.\n  STM32H743/H753 → high-end, full 32 kHz with DSP capability.\n• IMU (Inertial Measurement Unit): The gyroscope + accelerometer chip.\n  MPU6000: Reliable; limited to 8 kHz.\n  BMI270 / ICM42688P: Modern; up to 3.2 MHz SPI, very low noise — preferred for 32 kHz loops.\n• UARTs: Serial ports for connecting peripherals (GPS, VTX, RX, telemetry).\n• Firmware:\n  Betaflight: Best for racing/freestyle; fastest PID tuning tools, RPM filtering.\n  INAV: Navigation-focused; waypoints, return-to-home, fixed-wing support.\n  ArduPilot / PX4: Professional/research autopilot; full mission planning, sensor fusion, EKF.`},
    {title:"Battery",body:`Lithium-based cells store the energy that powers everything on the aircraft.\n\n• Cell count (S): Number of cells in series. Each LiPo cell = 3.7 V nominal (4.2 V fully charged, 3.5 V cutoff).\n  4S = 14.8 V nominal; 6S = 22.2 V; 12S = 44.4 V.\n• Capacity (mAh): Total charge stored. 1000 mAh = 1 Ah.\n• C-rating: Maximum safe discharge rate as a multiple of capacity.\n  Max amps = Capacity(Ah) × C-rating\n  Example: 1500 mAh × 100C = 150 A peak.\n• Chemistry:\n  LiPo (Lithium Polymer): Standard; high discharge, moderate energy density.\n  LiHV (High Voltage LiPo): Charges to 4.35 V/cell; ~9% more energy than LiPo.\n  Li-Ion (Lithium Ion): ~2.5× the energy density of LiPo but lower peak discharge (10–30C); ideal for long-range.\n• Connector types: BT2.0 (whoops), XT30 (micros), XT60 (standard), XT90/AS150 (large platforms).`},
    {title:"Propeller",body:`Props convert motor torque into thrust. Size is given as diameter × pitch.\n\n• Diameter (inches): Bigger diameter = more air moved = more thrust and efficiency at the cost of more inertia.\n• Pitch (inches): The theoretical distance a prop travels forward in one full revolution. Higher pitch = faster at high speed but draws more current.\n• Blade count:\n  2-blade: Lower drag, higher efficiency — preferred for long-range.\n  3-blade: Better thrust density, quicker response — standard for freestyle.\n  4/5-blade: Maximum thrust in a small diameter; used in cinewhoop designs.\n• Material: Carbon fibre props are stiffest and most efficient; plastic props absorb crashes better.\n• Matching: Match prop diameter to frame size. Too large = tip strikes on arms; too small = under-loaded motor runs hot.`},
    {title:"Video Transmitter (VTX)",body:`Sends live analogue or digital video from the drone to the pilot's goggles or monitor.\n\n• Analogue: 5.8 GHz FM signal. Very low latency (~1 ms). Lower image quality. Universal receiver compatibility.\n• DJI Digital: Compressed HD video (720p/1080p) at 14–28 ms latency. Requires DJI goggles.\n• HDZero: "Digital-analogue" hybrid; fixed bitrate HD at 4 ms latency. Requires HDZero goggles.\n• Walksnail Avatar: Another HD system from Caddx; comparable to DJI O3 in quality.\n\nPower levels (mW): Higher power = longer range but more heat, more battery draw, and often legally restricted.\nLatency matters for FPV racing — analogue and HDZero are preferred; DJI O3 is popular for cinematic freestyle.\n\nEcosystem lock: VTX and camera must be from the same system (e.g. DJI VTX requires DJI camera, Walksnail VTX requires Walksnail camera).`},
    {title:"Camera",body:`Captures the image the pilot sees. Must match the VTX system.\n\n• Analogue cameras output a composite video signal (NTSC/PAL) to an analogue VTX.\n• DJI cameras (O3/O4) connect directly to DJI Air Units via a proprietary cable.\n• HDZero cameras connect to HDZero VTX boards.\n• Walksnail cameras pair with Walksnail Avatar transmitters.\n\nFor FPV the camera is optimised for low-light performance and wide dynamic range, not resolution — the VTX link is the resolution bottleneck.`},
    {title:"Receiver (RX)",body:`Receives pilot control signals from the transmitter/controller on the ground.\n\n• ExpressLRS (ELRS): Open-source; 2.4 GHz or 900 MHz. Exceptional range and packet rate (up to 1000 Hz). Fastest growing protocol.\n• Crossfire (TBS CRSF): 915 MHz / 868 MHz. Pioneered long-range FPV; still widely used.\n• SBUS (FrSky): 100 Hz update rate; older technology but large installed base.\n• Protocols compared:\n  ELRS 2.4 GHz: Up to 5–10 km with directional antenna; 250 Hz nominal.\n  ELRS 900 MHz: 40+ km demonstrated range; better penetration.\n  CRSF: 1–3 km typical; excellent reliability.\n\nThe receiver connects to a UART on the flight controller and sends commands via CRSF serial (most modern systems) or SBUS.`},
    {title:"GPS Module",body:`Provides absolute position (latitude/longitude/altitude) and velocity for autonomous flight features.\n\n• Required for: Return-to-home, position hold, waypoint missions, geofencing.\n• Not required for: Manual FPV racing or freestyle (adds weight).\n• Chip tiers:\n  u-blox M8N: Entry level; 10 Hz update, 72-channel. ~18 g.\n  u-blox M10: Modern low-power version; 25 Hz update, 92-channel.\n  u-blox F9P: Survey-grade RTK; centimetre-level accuracy when paired with a base station. Used for precision agriculture and mapping.\n• Always pair GPS with a compass (magnetometer) for heading reference. Many GPS modules include one (e.g. BN-880, M10Q-5883).`},
  ]},
  {section:"Physics & Calculations",items:[
    {title:"All-Up Weight (AUW)",body:`The total flying mass of the vehicle including all components, payload, and battery.\n\nAUW = Σ(motor weights) + ESC weight + FC weight + prop weights + battery weight + frame weight + misc (wiring, standoffs ~30 g)\n\nWhy it matters: AUW directly determines how much thrust you need, your hover power consumption, and your flight time. Every gram saved has a compounding benefit — lighter aircraft hover at lower throttle, consuming less power, which further extends flight time.`},
    {title:"Thrust-to-Weight Ratio (T/W)",body:`The ratio of maximum available thrust to the aircraft's all-up weight.\n\nT/W = Total Max Thrust (g) ÷ AUW (g)\n\nInterpretation:\n• T/W < 2:1 — Cannot fly safely (insufficient excess thrust for control authority)\n• T/W 2–3:1 — Barely flyable; sluggish response; not recommended\n• T/W 3–4:1 — Good for long-range / cinematic; stable but not agile\n• T/W 4–6:1 — Freestyle sweet spot; responsive and efficient\n• T/W 6–10:1 — Racing; extremely snappy but harsh on batteries\n• T/W > 10:1 — Overpowered; mainly drag racers\n\nHover throttle ≈ 1/T/W × 100%\nA T/W of 4:1 means the drone hovers at ~25% throttle.`},
    {title:"Momentum Theory & Hover Power",body:`The foundational aerodynamic model used to estimate hover power consumption.\n\nThe induced power required to hover is:\n  Pᵢ = T^1.5 / √(2 · ρ · A · N)\n\nWhere:\n• T = total thrust required (= weight in newtons at hover)\n• ρ = air density (kg/m³)\n• A = disc area per motor (m²) = π × (prop radius)²\n• N = number of effective rotors\n\nActual shaft power accounts for propeller efficiency (Figure of Merit):\n  P_shaft = Pᵢ / FM\n\nElectrical power (accounting for ESC + motor efficiency ~83% × 95%):\n  P_elec = P_shaft / 0.83 / 0.95\n\nHover current: I = P_elec / (battery voltage × 0.9)`},
    {title:"Figure of Merit (FM)",body:`A dimensionless efficiency factor comparing a real propeller to an ideal actuator disc.\n\n  FM = P_ideal / P_actual\n\nRange: 0 (no efficiency) to 1 (perfect efficiency). Real props: 0.55–0.75.\n\n• 2-blade props: FM ≈ 0.68 (less blade interference, more efficient hover)\n• 3-blade props: FM ≈ 0.58 (more thrust density, slightly less efficient)\n• Frame material stiffness reduces FM: flexible frames vibrate, causing prop blade angle to fluctuate, wasting energy.\n  FM_effective = FM_base × material_stiffness_factor\n\nA 1% drop in FM increases hover power by ~1%, directly reducing flight time.`},
    {title:"ISA Atmosphere & Air Density",body:`Air density (ρ) decreases with altitude following the International Standard Atmosphere (ISA) model:\n\n  ρ = 1.225 × (1 − 0.0065 × h / 288.15)^4.2561  [kg/m³]\n\nWhere h = altitude in metres.\n\nAt sea level: ρ = 1.225 kg/m³\nAt 1000 m: ρ ≈ 1.112 kg/m³ (9% less dense)\nAt 3000 m: ρ ≈ 0.909 kg/m³ (26% less dense)\n\nLower air density means the propeller must spin faster to generate the same thrust, drawing more current. Flight time drops noticeably at high-altitude locations (mountains, plateaus). Always test your hover throttle estimate at the actual flying altitude.`},
    {title:"Peukert Effect & Usable Capacity",body:`Lithium batteries deliver less of their rated capacity when discharged at high currents. This is modelled by Peukert's law:\n\n  C_actual = C_rated × (I_rated / I_actual)^(k−1)\n\nWhere:\n• k = Peukert exponent (LiPo: ~1.05; Li-Ion: ~1.02)\n• I_rated = C_rated × capacity in Ah (1-hour discharge rate)\n• I_actual = actual discharge current\n\nFor a 1500 mAh / 150C LiPo discharging at 50 A:\n  C_actual = 1.5 × (1.5/50)^0.05 ≈ 1.35 Ah (10% reduction)\n\nThe calculator also applies an 80% Depth of Discharge (DoD) limit:\n  Usable energy = V × C × 0.8\nDischarging LiPo below 3.5 V/cell causes permanent capacity loss and swelling.`},
    {title:"C-Rating & Max Discharge",body:`The C-rating of a battery defines how quickly it can be safely discharged as a multiple of its capacity.\n\n  Max discharge (A) = Capacity (Ah) × C-rating\n\nExamples:\n• 1500 mAh × 100C = 150 A\n• 5000 mAh × 25C = 125 A\n• 30000 mAh × 15C = 450 A\n\nThe Peak vs Max Discharge metric shows what fraction of the battery's maximum current capability is used at full throttle. Staying below 75% leaves headroom for voltage sag. Above 90% the internal resistance causes significant voltage sag, reducing power and potentially triggering the low-voltage cutoff mid-flight.\n\nAdvertised C-ratings are often optimistic. Use reputable brands and verify with actual discharge tests.`},
    {title:"KV Rating",body:`KV is not "kilo-volts" — it means RPM per Volt (revolutions per minute per volt).\n\n  RPM = KV × V_battery\n\nExample: 1950 KV motor on 6S (22.2 V nominal):\n  RPM = 1950 × 22.2 = 43,290 RPM at no load (unloaded, full throttle)\n\nLoaded RPM (with prop) is typically 15–25% lower due to slip.\n\nLower KV + larger prop = more torque, better efficiency, suited to heavy-lift or long-range.\nHigher KV + smaller prop = higher RPM, faster response, suited to racing and freestyle.\n\nKV must be matched to battery voltage: running a 2400 KV motor on 6S without the right prop will over-current the motor and burn it.`},
    {title:"Disc Loading",body:`Disc loading is the thrust produced per unit of total swept disc area.\n\n  Disc Loading = Total Thrust (g) / (A × N)  [g/cm²]\n\nWhere A = disc area per motor = π × r²\n\nLower disc loading = more efficient hover (larger props moving air slowly).\nHigher disc loading = less efficient hover but more compact design.\n\nMomentum theory shows hover power scales as:\n  P ∝ T^1.5 / √(ρ · A · N)\n\nDoubling disc area reduces hover power by √2 ≈ 30% — why large agricultural drones with 30"+ props can carry heavy payloads for hours.`},
    {title:"ESC Headroom",body:`ESC headroom is the ratio of ESC continuous current rating to motor peak current draw.\n\n  Headroom (%) = (ESC_rating / Motor_peak) × 100\n\nExample: 60 A ESC, 36 A motor → 60/36 × 100 = 167%\n\nRecommended: ≥ 110% headroom (some margin for burst)\nWarning zone: 80–110% — ESC runs hot, lifespan reduced\nDanger: < 80% — thermal shutdown or failure risk\n\nNote: Continuous current ratings assume good airflow. In tightly packed stacks with no airflow, de-rate by 15–20%. Single ESCs on large craft often have active cooling fans.`},
    {title:"Centre of Gravity (CG) & Shift Penalty",body:`The CG is the point around which the aircraft balances. The flight controller continuously corrects for any CG offset using differential motor thrust, but this correction consumes extra energy.\n\nCG shift penalties in this calculator:\n• Battery on top: +1% hover power (minor shift up)\n• Battery on bottom: +2% (shifts CG low, requires more pitch correction)\n• FC above plate: +0.5%\n• FC below plate: +1%\n• ESC above plate: +0.5%\n• ESC below plate: +1.2%\n\nThese are approximations. In practice, significant CG offsets also reduce the aircraft's ability to recover quickly from disturbances, hurting both efficiency and flight performance.`},
  ]},
];

function DocsModal({onClose}){
  var T=useTheme();var t=T.t;
  var as=useState(null),active=as[0],setActive=as[1];
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"stretch",justifyContent:"center"}}>
    <div style={{background:t.bg,width:"100%",maxWidth:1100,display:"flex",height:"100vh",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"18px 28px",borderBottom:"1px solid "+t.bd,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.bg2,flexShrink:0}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:t.tb,fontFamily:SN}}>Technical Documentation</div>
          <div style={{fontSize:13,color:t.td,marginTop:2,fontFamily:SN}}>Component guides, physics theory, and the mathematics powering this simulator</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"1px solid "+t.bd,color:t.td,fontSize:22,cursor:"pointer",borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
      </div>
      {/* Body */}
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",flex:1,overflow:"hidden"}}>
        {/* Sidebar */}
        <div style={{borderRight:"1px solid "+t.bd,overflowY:"auto",padding:"12px 0",background:t.bg2}}>
          {DOCS.map(function(sec){return <div key={sec.section}>
            <div style={{padding:"8px 20px 4px",fontSize:10,fontWeight:700,color:t.ac,letterSpacing:1.5,fontFamily:MN}}>{sec.section.toUpperCase()}</div>
            {sec.items.map(function(item){var isA=active&&active.title===item.title;
              return <div key={item.title} onClick={function(){setActive(item);}} style={{padding:"9px 20px",fontSize:13,fontWeight:isA?700:400,color:isA?t.ac:t.tx,cursor:"pointer",background:isA?t.acL:"transparent",borderLeft:"3px solid "+(isA?t.ac:"transparent"),fontFamily:SN,transition:"all 0.1s"}}>{item.title}</div>;})}
          </div>;})}
        </div>
        {/* Content */}
        <div style={{overflowY:"auto",padding:"32px 40px"}}>
          {!active&&<div style={{color:t.td,fontSize:15,marginTop:40,textAlign:"center",fontFamily:SN}}>← Select a topic from the left to read its documentation.</div>}
          {active&&<>
            <div style={{fontSize:24,fontWeight:800,color:t.tb,marginBottom:8,fontFamily:SN}}>{active.title}</div>
            <div style={{width:48,height:3,background:t.ac,borderRadius:2,marginBottom:24}}/>
            {active.body.split("\n\n").map(function(para,i){
              var isFormula=para.startsWith("  ")||para.includes("= ")||para.includes("÷")||para.includes("×");
              if(isFormula){return <pre key={i} style={{background:t.bg2,border:"1px solid "+t.bd,borderRadius:10,padding:"14px 18px",fontFamily:MN,fontSize:13,color:t.ac,lineHeight:1.8,overflowX:"auto",marginBottom:16,whiteSpace:"pre-wrap"}}>{para.trim()}</pre>;}
              var isBulletBlock=para.startsWith("•")||para.includes("\n•");
              if(isBulletBlock){return <div key={i} style={{marginBottom:16}}>{para.split("\n").map(function(line,j){
                if(line.startsWith("•")){return <div key={j} style={{display:"flex",gap:10,marginBottom:6}}><span style={{color:t.ac,flexShrink:0,fontSize:15}}>•</span><span style={{fontSize:15,color:t.tx,lineHeight:1.7,fontFamily:SN}}>{line.slice(1).trim()}</span></div>;}
                return <div key={j} style={{fontSize:15,color:t.tx,lineHeight:1.7,fontFamily:SN,marginBottom:4}}>{line}</div>;
              })}</div>;}
              return <p key={i} style={{fontSize:15,color:t.tx,lineHeight:1.8,marginBottom:16,fontFamily:SN}}>{para}</p>;
            })}
          </>}
        </div>
      </div>
    </div>
  </div>);
}
function InfoTip({label}){
  var T=useTheme();var t=T.t;var def=PHYSICS_DEFS[label];if(!def)return null;
  var hs=useState(false),hovered=hs[0],setHovered=hs[1];
  return(<span onMouseEnter={function(){setHovered(true);}} onMouseLeave={function(){setHovered(false);}} style={{position:"relative",display:"inline-flex",alignItems:"center",marginLeft:5,cursor:"help"}}>
    <span style={{width:15,height:15,borderRadius:"50%",border:"1.5px solid "+t.td,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:t.td,fontFamily:SN,fontWeight:700,lineHeight:1,flexShrink:0}}>i</span>
    {hovered&&<div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",marginBottom:8,width:260,padding:"10px 14px",background:t.bg3,border:"1px solid "+t.bd,borderRadius:10,boxShadow:t.shH,fontSize:12,color:t.tx,lineHeight:1.6,fontFamily:SN,fontWeight:400,zIndex:20,pointerEvents:"none"}}>{def}</div>}
  </span>);
}
function MathPanel({insights,flight}){
  var T=useTheme();var t=T.t;if(!insights.length&&!flight)return null;
  return(<div style={{display:"grid",gridTemplateColumns:insights.length&&flight?"1fr 1fr":"1fr",gap:12,alignItems:"start"}}>
    {insights.length>0&&<div style={{background:t.sf,borderRadius:14,boxShadow:t.sh,padding:16,fontFamily:MN}}>
      <div style={{fontSize:11,fontWeight:700,color:t.ac,letterSpacing:1.5,marginBottom:12}}>PHYSICS BREAKDOWN</div>
      {insights.map(function(ins,i){var vc=ins.type==="good"?t.ac:ins.type==="bad"?t.rd:ins.type==="warn"?t.am:t.tb;
        return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"7px 0",borderBottom:"1px solid "+t.bdL,gap:8}}>
          <div><div style={{fontSize:12,color:t.tb,fontWeight:600,fontFamily:SN}}>{ins.label}<InfoTip label={ins.label}/></div><div style={{fontSize:11,color:t.td,marginTop:2,fontFamily:MN}}>{ins.formula}</div></div>
          <div style={{fontSize:14,fontWeight:700,color:vc,flexShrink:0}}>{ins.value}</div></div>;})}
    </div>}
    {flight&&<div style={{background:t.sf,borderRadius:14,boxShadow:t.sh,padding:16,fontFamily:MN}}>
      <div style={{fontSize:11,fontWeight:700,color:t.bl,letterSpacing:1.5,marginBottom:12}}>FLIGHT ESTIMATES</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div style={{textAlign:"center",background:t.acL,borderRadius:12,padding:14}}><div style={{fontSize:28,fontWeight:800,color:t.ac,fontFamily:SN}}>{flight.hoverTime}<span style={{fontSize:13,fontWeight:500}}> min</span></div><div style={{fontSize:11,color:t.td,marginTop:4,fontFamily:SN,fontWeight:600,letterSpacing:0.5}}>HOVER</div></div>
        <div style={{textAlign:"center",background:t.blL,borderRadius:12,padding:14}}><div style={{fontSize:28,fontWeight:800,color:t.bl,fontFamily:SN}}>{flight.cruiseTime}<span style={{fontSize:13,fontWeight:500}}> min</span></div><div style={{fontSize:11,color:t.td,marginTop:4,fontFamily:SN,fontWeight:600,letterSpacing:0.5}}>CRUISE</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        {[[flight.auw+"g","All-Up Weight",t.tb],[flight.twr+":1","Thrust/Weight",flight.twr>=4?t.ac:flight.twr>=2?t.am:t.rd],[flight.hoverThrottle+"%","Hover Throttle",t.tb],[flight.hoverPower+"W","Hover Power",t.tb]].map(function(r,i){
          return <div key={i} style={{background:t.bg2,borderRadius:10,padding:"10px 8px",textAlign:"center"}}><div style={{fontWeight:700,fontSize:16,color:r[2],fontFamily:SN}}>{r[0]}</div><div style={{fontSize:10,color:t.td,marginTop:3,fontFamily:SN,fontWeight:500}}>{r[1]}</div></div>;})}</div>
      <div style={{fontSize:12,color:t.td,lineHeight:1.7,fontFamily:MN}}>
        {Object.entries(flight.breakdown).map(function(en){return <div key={en[0]} style={{display:"flex",justifyContent:"space-between"}}><span style={{textTransform:"capitalize"}}>{en[0]}</span><span>{en[1]}g</span></div>;})}
        <div style={{borderTop:"1px solid "+t.bd,marginTop:4,paddingTop:4,fontWeight:700,color:t.tb,display:"flex",justifyContent:"space-between"}}><span>Total AUW</span><span>{flight.auw}g</span></div>
        <div style={{marginTop:6,fontSize:11,color:t.td,fontFamily:MN}}>ρ={flight.rho} kg/m³ · FM={flight.FM} · {flight.altitude}m ASL</div>
      </div>
    </div>}
  </div>);
}
function IssuesPanel({compat}){var T=useTheme();var t=T.t;if(!compat)return null;var e=compat.errors,w=compat.warnings;
  if(!e.length&&!w.length)return <div style={{padding:"10px 14px",background:t.acL,borderRadius:10,fontSize:13,color:t.ac,textAlign:"center",fontFamily:SN,fontWeight:600}}>✓ All components compatible</div>;
  return(<div style={{display:"flex",flexDirection:"column",gap:5}}>
    {e.map(function(x,i){return <div key={"e"+i} style={{padding:"9px 14px",background:t.rdL,borderRadius:9,fontSize:12,color:t.rd,fontFamily:SN,lineHeight:1.5,fontWeight:500}}>✕ {x.msg}</div>;})}
    {w.map(function(x,i){return <div key={"w"+i} style={{padding:"9px 14px",background:t.amL,borderRadius:9,fontSize:12,color:t.am,fontFamily:SN,lineHeight:1.5,fontWeight:500}}>⚠ {x.msg}</div>;})}
  </div>);
}

// ════════════════════════════════════════════════════
// LANDING
// ════════════════════════════════════════════════════
function LandingPage({onLaunch}){
  var T=useTheme();var t=T.t;var isDark=T.mode==="dark";
  var ns=useState(false),navOpen=ns[0],setNavOpen=ns[1];
  var ds=useState(false),showDocs=ds[0],setShowDocs=ds[1];
  return(<div style={{background:t.bg,color:t.tx,fontFamily:SN,minHeight:"100vh"}}>
    {showDocs&&<DocsModal onClose={function(){setShowDocs(false);}}/>}
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",background:t.bg+"e6",backdropFilter:"blur(16px)",borderBottom:"1px solid "+t.bd}}>
      <div style={{fontFamily:MN,fontWeight:700,fontSize:15,letterSpacing:1.2}}><span style={{color:t.tb}}>Multirotor</span><span style={{color:t.ac}}>.</span><span style={{color:t.tb}}>build</span></div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <button onClick={function(){T.toggle();}} style={{background:isDark?"#3a4055":t.sf,border:"2px solid "+(isDark?"#6aaeff":t.bd),borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,color:isDark?"#eceef6":t.td,fontWeight:600,transition:"all 0.2s"}}>{isDark?"☀ Light":"☾ Dark"}</button>
        <button onClick={function(){setNavOpen(!navOpen);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:3}}>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(45deg) translateY(5px)":"none"}}/>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",opacity:navOpen?0:1}}/>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(-45deg) translateY(-5px)":"none"}}/>
        </button></div>
    </nav>
    {navOpen&&<div style={{position:"fixed",top:52,right:16,zIndex:49,background:t.sf,borderRadius:14,boxShadow:t.shH,padding:"8px 0",minWidth:200,border:"1px solid "+t.bd}}>
      {[{l:"About",fn:function(){setNavOpen(false);}},{l:"Documentation",fn:function(){setShowDocs(true);setNavOpen(false);}},{l:"Compatibility Guide",fn:function(){setNavOpen(false);}},{l:"GitHub",fn:function(){setNavOpen(false);}}].map(function(item){return <div key={item.l} onClick={item.fn} style={{padding:"12px 20px",fontSize:14,color:t.tb,cursor:"pointer",fontWeight:500,fontFamily:SN}}>{item.l}</div>;})}
    </div>}
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"0 24px"}}>
      <svg viewBox="0 0 200 200" style={{width:150,height:150,marginBottom:36}}>
        <line x1="100" y1="100" x2="40" y2="40" stroke={t.ac} strokeWidth="1.5" opacity="0.35"/><line x1="100" y1="100" x2="160" y2="40" stroke={t.ac} strokeWidth="1.5" opacity="0.35"/>
        <line x1="100" y1="100" x2="40" y2="160" stroke={t.ac} strokeWidth="1.5" opacity="0.35"/><line x1="100" y1="100" x2="160" y2="160" stroke={t.ac} strokeWidth="1.5" opacity="0.35"/>
        {[[40,40],[160,40],[40,160],[160,160]].map(function(c,i){return <circle key={i} cx={c[0]} cy={c[1]} r="18" fill="none" stroke={t.bl} strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4"><animateTransform attributeName="transform" type="rotate" from={"0 "+c[0]+" "+c[1]} to={(i%2===0?"360 ":"-360 ")+c[0]+" "+c[1]} dur="4s" repeatCount="indefinite"/></circle>;})}
        <rect x="82" y="82" width="36" height="36" rx="3" fill="none" stroke={t.ac} strokeWidth="1.2" opacity="0.5"/>
        <polygon points="100,72 95,80 105,80" fill={t.ac} opacity="0.4"/>
      </svg>
      <h1 style={{fontSize:44,fontWeight:800,letterSpacing:-1.5,margin:0,lineHeight:1.1}}>
        <span style={{color:t.tb}}>Build.</span> <span style={{color:t.ac}}>Validate.</span> <span style={{color:t.bl}}>Fly.</span></h1>
      <p style={{fontSize:15,color:t.td,maxWidth:460,margin:"20px auto 36px",lineHeight:1.7}}>Interactive multi-rotor configurator with real-time compatibility checking, physics-based flight time estimation, and 3D visualization.</p>
      <button onClick={onLaunch} style={{background:t.ac,color:"#fff",border:"none",padding:"14px 40px",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:SN,letterSpacing:0.5,boxShadow:"0 4px 20px "+t.ac+"33"}}>Launch Builder →</button>
    </div>
    <div style={{padding:"60px 32px 80px",maxWidth:880,margin:"0 auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:16}}>
        {[{i:"◈",ti:"3D Visualization",d:"360° drone viewer with component placement. FC/ESC stack position and battery mount affect CG calculations."},
          {i:"⚡",ti:"Compatibility Engine",d:"Voltage, current, protocol, mounting, and VTX ecosystem validation with green/amber/red feedback."},
          {i:"◷",ti:"Flight Physics",d:"Momentum-theory with Peukert correction, ISA density, figure-of-merit efficiency, and CG shift modeling."}
        ].map(function(f,i){return <div key={i} style={{background:t.sf,borderRadius:16,padding:28,boxShadow:t.sh}}>
          <div style={{fontSize:28,marginBottom:14,color:t.ac}}>{f.i}</div><div style={{fontSize:15,fontWeight:700,color:t.tb,marginBottom:8}}>{f.ti}</div>
          <div style={{fontSize:12,color:t.td,lineHeight:1.65}}>{f.d}</div></div>;})}
      </div></div>
  </div>);
}

// ════════════════════════════════════════════════════
// BUILDER
// ════════════════════════════════════════════════════
function BuilderApp({goHome,goModeSelect,onSaveBuild}){
  var T=useTheme();var t=T.t;var isDark=T.mode==="dark";
  var ds=useState(false),showDocs=ds[0],setShowDocs=ds[1];
  var fs=useState(null),frame=fs[0],setFrame=fs[1];
  var sz=useState(null),size=sz[0],setSize=sz[1];
  var emptySel={motor:null,esc:null,fc:null,battery:null,prop:null,vtx:null,camera:null,rx:null,gps:null};
  var ss=useState(emptySel),sel=ss[0],setSel=ss[1];
  var ts2=useState("motor"),tab=ts2[0],setTab=ts2[1];
  var bs=useState("top"),battPos=bs[0],setBattPos=bs[1];
  var as2=useState(0),altitude=as2[0],setAltitude=as2[1];
  var us=useState(false),showUpload=us[0],setShowUpload=us[1];
  var st=useState(0),step=st[0],setStep=st[1];
  var ns=useState(false),navOpen=ns[0],setNavOpen=ns[1];
  var fp=useState("between"),fcPos=fp[0],setFcPos=fp[1];
  var ep=useState("between"),escPos=ep[0],setEscPos=ep[1];
  var fm=useState(null),frameMat=fm[0],setFrameMat=fm[1];
  var svs=useState([]),savedBuilds=svs[0],setSavedBuilds=svs[1];
  var cms=useState(false),showCompare=cms[0],setShowCompare=cms[1];

  var handleSelect=function(type,item){setSel(function(prev){var n={};for(var k in prev)n[k]=prev[k];n[type]=prev[type]&&prev[type].id===item.id?null:item;return n;});};
  var resetAll=function(){setSel(emptySel);};
  var saveBuild=function(){
    var name="Build "+(savedBuilds.length+1)+" — "+(frame?frame.name:"")+" "+(size?size.l:"");
    var b={id:Date.now(),name:name,frame:frame,size:size,frameMat:frameMat,sel:sel,battPos:battPos,fcPos:fcPos,escPos:escPos,flight:flight};
    setSavedBuilds(function(prev){return prev.concat([b]);});
    if(onSaveBuild)onSaveBuild(b);
  };

  var compat=useMemo(function(){var filled=Object.values(sel).filter(Boolean);if(filled.length<2)return null;return checkCompat(sel,size,frame,frameMat);},[sel,size,frame,frameMat]);
  var flight=useMemo(function(){return calcFlight(sel,size,frame,battPos,altitude,fcPos,escPos,frameMat);},[sel,size,frame,battPos,altitude,fcPos,escPos,frameMat]);
  var insights=useMemo(function(){return getMathInsights(sel,size,frame,fcPos,escPos,frameMat);},[sel,size,frame,fcPos,escPos,frameMat]);
  var getStatus=function(type){if(!compat)return null;if(compat.errors.some(function(e){return e.c.indexOf(type)>=0;}))return"error";if(compat.warnings.some(function(w){return w.c.indexOf(type)>=0;}))return"warning";return sel[type]?"ok":null;};
  var tabs=[{k:"motor",l:"Motors",db:MOTORS},{k:"esc",l:"Speed Controllers",db:ESCS},{k:"fc",l:"Flight Controller",db:FCS},{k:"battery",l:"Battery",db:BATTS},{k:"prop",l:"Props",db:PROPS},{k:"vtx",l:"Video Transmitter",db:VTXS},{k:"camera",l:"Camera",db:CAMS},{k:"rx",l:"Receiver",db:RXS},{k:"gps",l:"GPS Module",db:GPSS}];
  var currentTab=tabs.find(function(t2){return t2.k===tab;});
  var sizeFiltered=size?currentTab.db.filter(function(it){return it.s&&it.s.indexOf(size.id)>=0;}):currentTab.db;
  var otherItems=currentTab.db.filter(function(it){return sizeFiltered.indexOf(it)<0;});
  function sortByRating(items){var rated=items.map(function(it){return{item:it,rating:rateComponent(it,tab,sel,size,frame,frameMat)};});
    return{greens:rated.filter(function(r){return r.rating==="green";}),ambers:rated.filter(function(r){return r.rating==="amber";}),reds:rated.filter(function(r){return r.rating==="red";})};
  }
  var recommended=sortByRating(sizeFiltered);var otherSorted=sortByRating(otherItems);

  return(<div style={{minHeight:"100vh",background:t.bg,color:t.tx,fontFamily:SN}}>
    {showDocs&&<DocsModal onClose={function(){setShowDocs(false);}}/>}
    {showUpload&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:150,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:t.bg3,borderRadius:20,padding:28,maxWidth:500,width:"90%",maxHeight:"80vh",overflowY:"auto",boxShadow:t.shH}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div style={{fontSize:18,fontWeight:700,color:t.ac,fontFamily:SN}}>Upload Component</div>
          <button onClick={function(){setShowUpload(false);}} style={{background:"none",border:"none",color:t.td,fontSize:22,cursor:"pointer"}}>×</button></div>
        <div style={{fontSize:13,color:t.td,lineHeight:1.7,marginBottom:14,fontFamily:SN}}>Fork github.com/lazyonbed/multirotor-build, add JSON to componentDatabase.js, open a PR.</div>
        {Object.entries(UPSCH).map(function(en){return <div key={en[0]} style={{background:t.bg2,borderRadius:10,padding:14,marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,color:t.ac,marginBottom:5,textTransform:"uppercase",fontFamily:SN}}>{en[0]}</div>
          <div style={{fontSize:12,color:t.td,fontFamily:MN,lineHeight:1.5}}>{en[1].req.join(", ")}</div><div style={{fontSize:12,color:t.td,marginTop:5,fontFamily:SN}}>{en[1].doc}</div></div>;})}
      </div></div>}

    {/* Header */}
    <div style={{padding:"12px 24px",borderBottom:"1px solid "+t.bd,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.bg+"e6",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
      <div onClick={goHome} style={{fontFamily:MN,fontWeight:700,fontSize:15,letterSpacing:1.2,cursor:"pointer"}}><span style={{color:t.tb}}>Multirotor</span><span style={{color:t.ac}}>.</span><span style={{color:t.tb}}>build</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {step===0&&goModeSelect&&<button onClick={goModeSelect} style={{background:t.sf,border:"1px solid "+t.bd,color:t.td,padding:"7px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:SN,fontWeight:500}}>← Change Mode</button>}
        {step===1&&<button onClick={function(){setStep(0);}} style={{background:t.sf,border:"1px solid "+t.bd,color:t.td,padding:"7px 16px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:SN,fontWeight:500}}>← Frame Setup</button>}
        <button onClick={function(){T.toggle();}} style={{background:isDark?"#3a4055":t.sf,border:"2px solid "+(isDark?"#6aaeff":t.bd),borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,color:isDark?"#eceef6":t.td,fontWeight:600,transition:"all 0.2s"}}>{isDark?"☀ Light":"☾ Dark"}</button>
        <button onClick={function(){setNavOpen(!navOpen);}} style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"flex",flexDirection:"column",gap:4}}>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(45deg) translateY(6px)":"none"}}/>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",opacity:navOpen?0:1}}/>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(-45deg) translateY(-6px)":"none"}}/>
        </button></div>
    </div>
    {navOpen&&<div style={{position:"fixed",top:52,right:16,zIndex:39,background:t.sf,borderRadius:14,boxShadow:t.shH,padding:"8px 0",minWidth:210,border:"1px solid "+t.bd}}>
      {[{l:"Home",fn:function(){goHome();setNavOpen(false);}},
        {l:"Documentation",fn:function(){setShowDocs(true);setNavOpen(false);}},
        {l:"About",fn:function(){setNavOpen(false);}},
        {l:"Compatibility Guide",fn:function(){setNavOpen(false);}},
      ].map(function(item){return <div key={item.l} onClick={item.fn} style={{padding:"12px 22px",fontSize:14,color:t.tb,cursor:"pointer",fontWeight:500,fontFamily:SN}}>{item.l}</div>;})}
    </div>}

    {step===0&&(<div style={{padding:"36px 32px",maxWidth:960,margin:"0 auto"}}>
      {/* ① Frame Type */}
      <div style={{marginBottom:36}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:t.ac,letterSpacing:1.5,fontFamily:MN}}>① FRAME TYPE</div>
          {frame&&<button onClick={function(){setFrame(null);}} style={{fontSize:12,color:t.td,background:"none",border:"1px solid "+t.bd,borderRadius:6,padding:"2px 10px",cursor:"pointer",fontFamily:SN}}>× Clear</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(145px, 1fr))",gap:10}}>
          {FRAME_TYPES.map(function(ft){var a=frame&&frame.id===ft.id;
            return <div key={ft.id} onClick={function(){setFrame(a?null:ft);}} style={{padding:"14px 10px",background:a?t.acL:t.sf,border:"2px solid "+(a?t.ac:t.bd),borderRadius:14,cursor:"pointer",textAlign:"center",boxShadow:a?t.sh:"none",transition:"all 0.15s"}}>
              <div style={{fontSize:15,fontWeight:700,color:a?t.ac:t.tb,fontFamily:SN}}>{ft.name}</div>
              <div style={{fontSize:12,color:t.td,marginTop:5,fontFamily:SN}}>{ft.mc} motors</div>
              <div style={{fontSize:11,color:t.td,marginTop:2,fontFamily:SN}}>{ft.desc}</div>
            </div>;})}</div></div>

      {/* ② Size */}
      <div style={{marginBottom:36}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:t.bl,letterSpacing:1.5,fontFamily:MN}}>② SIZE</div>
          {size&&<button onClick={function(){setSize(null);}} style={{fontSize:12,color:t.td,background:"none",border:"1px solid "+t.bd,borderRadius:6,padding:"2px 10px",cursor:"pointer",fontFamily:SN}}>× Clear</button>}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {SIZES.map(function(s){var a=size&&size.id===s.id;
            return <div key={s.id} onClick={function(){setSize(a?null:s);}} style={{padding:"10px 18px",background:a?t.blL:t.sf,border:"2px solid "+(a?t.bl:t.bd),borderRadius:12,cursor:"pointer",boxShadow:a?t.sh:"none",transition:"all 0.15s",minWidth:80,textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:800,color:a?t.bl:t.tb,fontFamily:MN}}>{s.l}</div>
              <div style={{fontSize:12,color:t.td,marginTop:3,fontFamily:SN}}>{s.mm}mm</div>
              <div style={{fontSize:11,color:t.td,fontFamily:SN}}>{s.cat}</div>
            </div>;})}</div></div>

      {/* ③ Frame Material */}
      <div style={{marginBottom:36}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:t.ac,letterSpacing:1.5,fontFamily:MN}}>③ FRAME MATERIAL</div>
          {frameMat&&<button onClick={function(){setFrameMat(null);}} style={{fontSize:12,color:t.td,background:"none",border:"1px solid "+t.bd,borderRadius:6,padding:"2px 10px",cursor:"pointer",fontFamily:SN}}>× Clear</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))",gap:10}}>
          {FRAME_MATERIALS.map(function(mat){var a=frameMat&&frameMat.id===mat.id;
            return <div key={mat.id} onClick={function(){setFrameMat(a?null:mat);}} style={{padding:"14px 12px",background:a?t.acL:t.sf,border:"2px solid "+(a?t.ac:t.bd),borderRadius:14,cursor:"pointer",boxShadow:a?t.sh:"none",transition:"all 0.15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontSize:15,fontWeight:700,color:a?t.ac:t.tb,fontFamily:SN}}>{mat.name}</div>
                <span style={{fontSize:12,color:t.td,fontFamily:MN,fontWeight:600}}>{mat.cost}</span>
              </div>
              <div style={{fontSize:12,color:t.td,marginBottom:4,fontFamily:SN,lineHeight:1.4}}>{mat.desc}</div>
              <div style={{fontSize:11,color:t.td,fontFamily:MN}}>Density {mat.df}× · Stiffness {Math.round(mat.stiffness*100)}%</div>
            </div>;})}
        </div></div>

      {!frameMat&&<div style={{fontSize:14,color:t.td,fontFamily:SN,marginBottom:12}}>Select a frame material above to continue.</div>}
      {frame&&size&&frameMat&&<button onClick={function(){setSel(emptySel);setStep(1);}} style={{background:t.ac,color:"#fff",border:"none",padding:"15px 44px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:SN,boxShadow:"0 4px 20px "+t.ac+"44"}}>Start Building →</button>}
    </div>)}

    {/* Compare modal */}
    {showCompare&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:t.bg3,borderRadius:20,padding:24,maxWidth:900,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:t.shH}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:700,color:t.tb}}>Compare Builds</div>
          <button onClick={function(){setShowCompare(false);}} style={{background:"none",border:"none",color:t.td,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        {savedBuilds.length===0&&<div style={{color:t.td,fontSize:13,textAlign:"center",padding:"32px 0"}}>No saved builds yet. Save a build first using the "Save Build" button.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {savedBuilds.map(function(b){
            var bf=b.flight;
            return <div key={b.id} style={{background:t.bg2,borderRadius:14,padding:16,border:"1px solid "+t.bd}}>
              <div style={{fontSize:13,fontWeight:700,color:t.tb,marginBottom:10}}>{b.name}</div>
              <div style={{fontSize:11,color:t.td,marginBottom:4}}>{b.frame?b.frame.name:"-"} · {b.size?b.size.l:"-"} · {b.frameMat?b.frameMat.name:"-"}</div>
              {bf&&<>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
                  <div style={{background:t.acL,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:t.ac}}>{bf.hoverTime}<span style={{fontSize:9}}> min</span></div>
                    <div style={{fontSize:8,color:t.td}}>HOVER</div>
                  </div>
                  <div style={{background:t.blL,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:t.bl}}>{bf.cruiseTime}<span style={{fontSize:9}}> min</span></div>
                    <div style={{fontSize:8,color:t.td}}>CRUISE</div>
                  </div>
                </div>
                <div style={{marginTop:8,fontSize:11,color:t.td,fontFamily:MN,display:"flex",flexDirection:"column",gap:3}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>AUW</span><span style={{color:t.tb,fontWeight:600}}>{bf.auw}g</span></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>T/W Ratio</span><span style={{color:bf.twr>=4?t.ac:bf.twr>=2?t.am:t.rd,fontWeight:700}}>{bf.twr}:1</span></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>Hover Power</span><span style={{color:t.tb}}>{bf.hoverPower}W</span></div>
                </div>
              </>}
              {!bf&&<div style={{fontSize:11,color:t.td,marginTop:10}}>No flight data — select motor + battery to calculate.</div>}
              <div style={{marginTop:12,display:"flex",gap:6}}>
                <button onClick={function(){setShowCompare(false);}} style={{flex:1,padding:"6px 0",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:SN,fontWeight:600,background:t.acL,border:"1px solid "+t.ac,color:t.ac}}>Load</button>
                <button onClick={function(){setSavedBuilds(function(prev){return prev.filter(function(x){return x.id!==b.id;});});}} style={{padding:"6px 10px",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:SN,background:"none",border:"1px solid "+t.rd+"66",color:t.rd}}>×</button>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>}

    {step===1&&(<div style={{display:"grid",gridTemplateColumns:"300px 1fr 1.4fr",height:"calc(100vh - 54px)",overflow:"hidden"}}>

      {/* Col 1 — 3D Drone viewer, always visible, fixed height, no scroll */}
      <div style={{borderRight:"1px solid "+t.bd,background:t.bg,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{flexShrink:0,padding:"10px 12px 6px"}}>
          <DroneViewer frameType={frame} droneSize={size} selections={sel} batteryPos={battPos} fcPos={fcPos} escPos={escPos} frameMat={frameMat}/>
        </div>
        {/* Component chips */}
        <div style={{padding:"6px 12px",display:"flex",flexWrap:"wrap",gap:4,flexShrink:0}}>
          {tabs.map(function(tb2){var s=sel[tb2.k],st2=getStatus(tb2.k);
            var pBg=s?(st2==="error"?t.rdL:st2==="warning"?t.amL:t.acL):t.bg2;
            var pC=s?(st2==="error"?t.rd:st2==="warning"?t.am:t.ac):t.td;
            return <div key={tb2.k} onClick={function(){setTab(tb2.k);}} title={tb2.l} style={{padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:SN,background:pBg,color:pC,border:"1px solid "+pC+"55",whiteSpace:"nowrap",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis"}}>{s?s.b+" "+s.m:tb2.l}</div>;})}
        </div>
        {/* Save/Compare buttons */}
        <div style={{padding:"6px 12px",display:"flex",gap:6,flexShrink:0}}>
          <button onClick={saveBuild} style={{flex:1,padding:"9px 0",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:SN,fontWeight:700,background:t.acL,border:"1px solid "+t.ac,color:t.ac}}>💾 Save Build</button>
          {savedBuilds.length>0&&<button onClick={function(){setShowCompare(true);}} style={{flex:1,padding:"9px 0",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:SN,fontWeight:700,background:t.bg2,border:"1px solid "+t.bd,color:t.tb}}>⇄ {savedBuilds.length}</button>}
        </div>
        {/* Placement controls — scrollable if needed */}
        <div style={{flex:1,overflowY:"auto",padding:"6px 12px 12px"}}>
          <div style={{background:t.sf,borderRadius:12,padding:"12px 14px",boxShadow:t.sh,marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,color:t.ac,letterSpacing:1.2,marginBottom:10,fontFamily:MN}}>COMPONENT PLACEMENT</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,color:t.tb,fontFamily:SN,fontWeight:600,minWidth:130}}>Flight Controller</span>
              {["above","between","below"].map(function(p){return <button key={"fc"+p} onClick={function(){setFcPos(p);}} style={{padding:"4px 10px",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:SN,fontWeight:500,background:fcPos===p?t.acL:t.bg2,border:"1px solid "+(fcPos===p?t.ac:t.bd),color:fcPos===p?t.ac:t.td}}>{p}</button>;})}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,color:t.tb,fontFamily:SN,fontWeight:600,minWidth:130}}>Speed Controller</span>
              {["above","between","below"].map(function(p){return <button key={"esc"+p} onClick={function(){setEscPos(p);}} style={{padding:"4px 10px",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:SN,fontWeight:500,background:escPos===p?t.acL:t.bg2,border:"1px solid "+(escPos===p?t.ac:t.bd),color:escPos===p?t.ac:t.td}}>{p}</button>;})}
            </div>
            {sel.battery&&<div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,color:t.tb,fontFamily:SN,fontWeight:600,minWidth:130}}>Battery</span>
              {["top","between","bottom"].map(function(p){return <button key={p} onClick={function(){setBattPos(p);}} style={{padding:"4px 10px",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:SN,fontWeight:500,background:battPos===p?t.acL:t.bg2,border:"1px solid "+(battPos===p?t.ac:t.bd),color:battPos===p?t.ac:t.td}}>{p}</button>;})}
            </div>}
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:12,color:t.tb,fontFamily:SN,fontWeight:600,minWidth:130}}>Altitude</span>
              <input type="range" min={0} max={5000} step={100} value={altitude} onChange={function(e){setAltitude(+e.target.value);}} style={{flex:1,accentColor:t.ac}}/>
              <span style={{fontSize:12,color:t.ac,fontFamily:MN,minWidth:46,textAlign:"right",fontWeight:700}}>{altitude}m</span>
            </div>
          </div>
          <IssuesPanel compat={compat}/>
        </div>
      </div>

      {/* Col 2 — Physics Breakdown + Flight Estimates, scrollable */}
      <div style={{borderRight:"1px solid "+t.bd,overflowY:"auto",background:t.bg2,padding:"14px 16px"}}>
        <MathPanel insights={insights} flight={flight}/>
        {!insights.length&&!flight&&<div style={{color:t.td,fontSize:14,textAlign:"center",padding:"40px 20px",fontFamily:SN}}>Select a motor and battery to see physics calculations and flight time estimates.</div>}
      </div>

      {/* Col 3 — Component picker */}
      <div style={{display:"flex",flexDirection:"column",background:t.bg2,borderLeft:"1px solid "+t.bd}}>
        <div style={{display:"flex",borderBottom:"1px solid "+t.bd,alignItems:"center",padding:"0 6px",background:t.bg,flexShrink:0}}>
          <div style={{display:"flex",flex:1,overflowX:"auto"}}>
            {tabs.map(function(tb2){var active=tab===tb2.k;var st2=getStatus(tb2.k);
              return <button key={tb2.k} onClick={function(){setTab(tb2.k);}} style={{padding:"13px 10px",background:active?t.bg2:"transparent",border:"none",borderBottom:"2.5px solid "+(active?t.ac:"transparent"),
                color:active?t.ac:st2==="error"?t.rd:st2==="warning"?t.am:st2==="ok"?t.ac:t.td,
                fontSize:12,fontWeight:active?700:500,cursor:"pointer",fontFamily:SN,whiteSpace:"nowrap",minWidth:60}}>{tb2.l}</button>;})}
          </div>
          <div style={{display:"flex",gap:5,paddingRight:6,flexShrink:0}}>
            <button onClick={function(){setShowUpload(true);}} style={{background:"none",border:"1px solid "+t.bd,color:t.td,padding:"6px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:SN,fontWeight:500,whiteSpace:"nowrap"}}>+ Upload</button>
            <button onClick={resetAll} style={{background:"none",border:"1px solid "+t.bd,color:t.rd,padding:"6px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:SN,fontWeight:600,whiteSpace:"nowrap"}}>Reset</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
          {sizeFiltered.length>0&&<>
            <div style={{fontSize:12,color:t.td,marginBottom:10,letterSpacing:0.8,fontFamily:SN,fontWeight:600}}>RECOMMENDED FOR {size?size.l.toUpperCase():""}</div>
            {recommended.greens.slice(0,3).map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="green"/>;})}
            {recommended.ambers.slice(0,3).map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="amber"/>;})}
            {recommended.reds.slice(0,3).map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="red"/>;})}
          </>}
          {otherItems.length>0&&<>
            <div style={{fontSize:12,color:t.td,marginTop:18,marginBottom:10,letterSpacing:0.8,fontFamily:SN,fontWeight:600}}>OTHER OPTIONS</div>
            {otherSorted.greens.map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="green"/>;})}
            {otherSorted.ambers.map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="amber"/>;})}
            {otherSorted.reds.map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="red"/>;})}
          </>}
        </div>
      </div>
    </div>)}
  </div>);
}

// ════════════════════════════════════════════════════
// MODE SELECT PAGE
// ════════════════════════════════════════════════════
function ModeSelectPage({onSelect,onBack}){
  var T=useTheme();var t=T.t;var isDark=T.mode==="dark";
  var modes=[
    {id:"beginner",icon:"🟢",title:"Beginner",sub:"First build",desc:"Guided setup with curated component choices and simplified compatibility feedback. Perfect if you are new to multirotors."},
    {id:"enthusiast",icon:"🔵",title:"Enthusiast",sub:"Full builder",desc:"Complete component library with real-time physics simulation, 3D visualization, and detailed compatibility analysis."},
    {id:"researcher",icon:"🟣",title:"Researcher",sub:"Advanced mode",desc:"All Enthusiast features plus full physics breakdown, figure-of-merit tuning, material science data, and export tools."},
  ];
  return(<div style={{background:t.bg,minHeight:"100vh",fontFamily:SN,color:t.tx}}>
    <nav style={{padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid "+t.bd,background:t.bg+"e6",backdropFilter:"blur(16px)"}}>
      <div style={{fontFamily:MN,fontWeight:700,fontSize:15,letterSpacing:1.2,cursor:"pointer"}} onClick={onBack}><span style={{color:t.tb}}>Multirotor</span><span style={{color:t.ac}}>.</span><span style={{color:t.tb}}>build</span></div>
      <button onClick={function(){T.toggle();}} style={{background:isDark?"#3a4055":t.sf,border:"2px solid "+(isDark?"#6aaeff":t.bd),borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,color:isDark?"#eceef6":t.td,fontWeight:600}}>{isDark?"☀ Light":"☾ Dark"}</button>
    </nav>
    <div style={{maxWidth:760,margin:"0 auto",padding:"60px 24px",textAlign:"center"}}>
      <div style={{fontSize:11,fontWeight:700,color:t.ac,letterSpacing:2,marginBottom:16,fontFamily:MN}}>SELECT YOUR MODE</div>
      <h2 style={{fontSize:32,fontWeight:800,color:t.tb,margin:"0 0 12px",letterSpacing:-0.5}}>How do you want to build?</h2>
      <p style={{fontSize:14,color:t.td,marginBottom:48,lineHeight:1.7}}>Choose the experience that matches your level. You can switch modes at any time.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
        {modes.map(function(m){
          return <div key={m.id} onClick={function(){onSelect(m.id);}} style={{background:t.sf,border:"2px solid "+t.bd,borderRadius:20,padding:"32px 24px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",boxShadow:t.sh}}
            onMouseEnter={function(e){e.currentTarget.style.borderColor=t.ac;e.currentTarget.style.boxShadow=t.shH;}}
            onMouseLeave={function(e){e.currentTarget.style.borderColor=t.bd;e.currentTarget.style.boxShadow=t.sh;}}>
            <div style={{fontSize:36,marginBottom:16}}>{m.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:t.tb,marginBottom:4}}>{m.title}</div>
            <div style={{fontSize:11,color:t.ac,fontFamily:MN,fontWeight:600,marginBottom:12,letterSpacing:1}}>{m.sub.toUpperCase()}</div>
            <div style={{fontSize:13,color:t.td,lineHeight:1.65}}>{m.desc}</div>
            <div style={{marginTop:20,padding:"10px 0",borderRadius:10,background:t.acL,textAlign:"center",fontSize:13,fontWeight:700,color:t.ac}}>Select {m.title} →</div>
          </div>;
        })}
      </div>
      <button onClick={onBack} style={{marginTop:36,background:"none",border:"none",color:t.td,fontSize:13,cursor:"pointer",textDecoration:"underline"}}>← Back to home</button>
    </div>
  </div>);
}

// ════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════
export default function App(){
  var ps=useState("landing"),page=ps[0],setPage=ps[1];
  var sbs=useState(null),summaryBuild=sbs[0],setSummaryBuild=sbs[1];
  var ms=useState("dark"),mode=ms[0],setMode=ms[1];
  var t=mode==="dark"?DARK:LIGHT;
  var ctx={t:t,mode:mode,toggle:function(){setMode(mode==="dark"?"light":"dark");}};
  var goHome=function(){setPage("landing");};
  return(<ThemeCtx.Provider value={ctx}>
    {page==="landing"&&<LandingPage onLaunch={function(){setPage("mode-select");}}/>}
    {page==="mode-select"&&<ModeSelectPage onSelect={function(){setPage("builder");}} onBack={goHome}/>}
    {page==="builder"&&<BuilderApp goHome={goHome} goModeSelect={function(){setPage("mode-select");}} onSaveBuild={function(b){setSummaryBuild(b);setPage("summary");}}/>}
    {page==="summary"&&summaryBuild&&<BuildSummaryPage build={summaryBuild} onBackToBuilder={function(){setPage("builder");}} onBack={goHome}/>}
  </ThemeCtx.Provider>);
}
