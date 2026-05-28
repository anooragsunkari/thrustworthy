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
  bd:"rgba(255,255,255,0.07)",bdL:"rgba(255,255,255,0.04)",
  tx:"#b8bcc8",td:"#686d7a",tb:"#dce0ea",
  ac:"#5b9cf6",acL:"#1a2840",acT:"#4b8cf0",
  bl:"#5b9cf6",blL:"#1a2840",
  am:"#e8a838",amL:"#2e2410",
  rd:"#ef5555",rdL:"#2e1414",
  sh:"0 1px 3px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.12)",
  shH:"0 2px 8px rgba(0,0,0,0.2), 0 10px 24px rgba(0,0,0,0.18)",
  canvas:"#12141a",
};
const MN = "'DM Mono', 'IBM Plex Mono', monospace";
const SN = "'DM Sans', -apple-system, sans-serif";

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
  {id:"cf",name:"Carbon Fiber",desc:"Light · stiff · industry standard",df:1.0,stiffness:0.98,color:0x1a1a1f,colorL:0x2a2a30,cost:"$$$"},
  {id:"al",name:"Aluminum 6061",desc:"Durable · heavier · easy to machine",df:1.75,stiffness:0.92,color:0x7a7a88,colorL:0x9a9aa8,cost:"$$"},
  {id:"tpu",name:"3D Print (TPU)",desc:"Flexible · crash resistant · heaviest",df:1.4,stiffness:0.72,color:0x2a2a3a,colorL:0x444455,cost:"$"},
  {id:"fg",name:"Fiberglass/FR4",desc:"Cheap · moderate weight · PCB-like",df:1.15,stiffness:0.82,color:0x2a3a20,colorL:0x4a5a38,cost:"$"},
  {id:"ti",name:"Titanium",desc:"Strongest · heaviest · premium",df:2.8,stiffness:0.96,color:0x555565,colorL:0x888898,cost:"$$$$"},
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
  {id:"m1",b:"T-Motor",m:"F40 Pro IV",kv:1950,sz:"2306",vn:14.8,vx:25.2,ic:36,w:32,t:1550,e:7.2,mt:16,s:["5in"]},
  {id:"m2",b:"T-Motor",m:"F60 Pro V",kv:1750,sz:"2207",vn:14.8,vx:25.2,ic:42,w:34,t:1750,e:7.0,mt:16,s:["5in","6in"]},
  {id:"m3",b:"T-Motor",m:"Velox V3 2207",kv:1950,sz:"2207",vn:14.8,vx:25.2,ic:40,w:31,t:1680,e:7.1,mt:16,s:["5in"]},
  {id:"m4",b:"T-Motor",m:"F1507 3800KV",kv:3800,sz:"1507",vn:11.1,vx:14.8,ic:18,w:14,t:620,e:6.5,mt:12,s:["3in","4in"]},
  {id:"m5",b:"T-Motor",m:"U5 KV400",kv:400,sz:"3508",vn:22.2,vx:44.4,ic:25,w:112,t:3200,e:10.5,mt:19,s:["10in","12in","13in"]},
  {id:"m6",b:"T-Motor",m:"U7 V2 KV280",kv:280,sz:"4910",vn:22.2,vx:44.4,ic:30,w:175,t:5000,e:11.5,mt:19,s:["12in","13in","15in"]},
  {id:"m7",b:"T-Motor",m:"U8 Lite KV85",kv:85,sz:"8108",vn:44.4,vx:51.8,ic:55,w:280,t:9800,e:12.0,mt:25,s:["13in","15in"]},
  {id:"m8",b:"T-Motor",m:"MN3508 KV380",kv:380,sz:"3508",vn:22.2,vx:25.2,ic:18,w:102,t:2400,e:10.0,mt:19,s:["9in","10in"]},
  {id:"m10",b:"EMAX",m:"ECO II 2207",kv:1900,sz:"2207",vn:11.1,vx:22.2,ic:35,w:30,t:1420,e:7.5,mt:16,s:["5in"]},
  {id:"m11",b:"EMAX",m:"ECO II 2306",kv:1700,sz:"2306",vn:14.8,vx:25.2,ic:33,w:32,t:1500,e:7.6,mt:16,s:["5in","6in"]},
  {id:"m12",b:"EMAX",m:"TH1103 7000KV",kv:7000,sz:"1103",vn:3.7,vx:11.1,ic:8,w:4.5,t:180,e:5.0,mt:9,s:["65mm","75mm","2in"]},
  {id:"m13",b:"iFlight",m:"XING2 2207",kv:1855,sz:"2207",vn:14.8,vx:25.2,ic:40,w:31.5,t:1640,e:7.1,mt:16,s:["5in"]},
  {id:"m14",b:"iFlight",m:"XING2 2806.5",kv:1350,sz:"2806",vn:14.8,vx:25.2,ic:38,w:41,t:1850,e:8.2,mt:16,s:["6in","7in"]},
  {id:"m15",b:"iFlight",m:"XING2 1404",kv:3800,sz:"1404",vn:11.1,vx:14.8,ic:12,w:8.5,t:400,e:6.2,mt:12,s:["3in","3.5in"]},
  {id:"m16",b:"BrotherHobby",m:"Avenger 2812",kv:900,sz:"2812",vn:22.2,vx:25.2,ic:32,w:48,t:2100,e:8.5,mt:19,s:["7in","8in"]},
  {id:"m17",b:"KDE Direct",m:"KDE4012XF-400",kv:400,sz:"4012",vn:22.2,vx:44.4,ic:30,w:142,t:4500,e:11.0,mt:19,s:["10in","12in","13in"]},
  {id:"m18",b:"KDE Direct",m:"KDE5215XF-220",kv:220,sz:"5215",vn:22.2,vx:51.8,ic:35,w:210,t:6200,e:11.8,mt:19,s:["12in","13in","15in"]},
  {id:"m19",b:"Hobbywing",m:"XRotor X8",kv:100,sz:"8108",vn:44.4,vx:51.8,ic:80,w:480,t:15300,e:12.0,mt:25,s:["13in","15in"]},
  {id:"m20",b:"BetaFPV",m:"1404 3800KV",kv:3800,sz:"1404",vn:11.1,vx:14.8,ic:14,w:9,t:430,e:6.0,mt:12,s:["3in","4in"]},
  {id:"m21",b:"BetaFPV",m:"1102 18000KV",kv:18000,sz:"1102",vn:3.7,vx:3.8,ic:5,w:3.2,t:62,e:4.2,mt:6.6,s:["65mm","75mm"]},
  {id:"m22",b:"Axis Flying",m:"C207 1960KV",kv:1960,sz:"2207",vn:14.8,vx:25.2,ic:42,w:30,t:1700,e:7.3,mt:16,s:["5in"]},
  {id:"m23",b:"GEPRC",m:"SPEEDX2 2207.5",kv:1960,sz:"2207",vn:14.8,vx:25.2,ic:38,w:30,t:1600,e:7.2,mt:16,s:["5in"]},
  {id:"m24",b:"Lumenier",m:"ZIP 2207",kv:1750,sz:"2207",vn:14.8,vx:25.2,ic:36,w:30,t:1580,e:7.3,mt:16,s:["5in"]},
  {id:"m25",b:"RCInPower",m:"GTS V2 2207",kv:1860,sz:"2207",vn:14.8,vx:25.2,ic:39,w:30,t:1650,e:7.4,mt:16,s:["5in"]},
  {id:"m26",b:"SunnySky",m:"X2216 1250KV",kv:1250,sz:"2216",vn:11.1,vx:14.8,ic:20,w:58,t:900,e:8.0,mt:16,s:["6in","7in"]},
  {id:"m27",b:"MAD",m:"M40 KV90",kv:90,sz:"4010",vn:44.4,vx:51.8,ic:45,w:350,t:12000,e:11.5,mt:25,s:["12in","13in","15in"]},
  {id:"m28",b:"HappyModel",m:"EX0802",kv:19000,sz:"0802",vn:3.7,vx:3.8,ic:4,w:2.5,t:50,e:3.8,mt:6.6,s:["65mm"]},
  {id:"m29",b:"iFlight",m:"XING2 3110",kv:900,sz:"3110",vn:22.2,vx:25.2,ic:35,w:68,t:2400,e:9.5,mt:19,s:["7in","8in","9in"]},
  {id:"m30",b:"Scorpion",m:"SII-4020",kv:630,sz:"4020",vn:22.2,vx:44.4,ic:25,w:150,t:4000,e:10.5,mt:19,s:["10in","12in"]},
  {id:"m31",b:"Hacker",m:"Q80-8M V2",kv:100,sz:"8020",vn:44.4,vx:51.8,ic:65,w:450,t:16000,e:12.2,mt:25,s:["13in","15in"]},
];
const ESCS=[
  {id:"e1",b:"Hobbywing",m:"XRotor 60A 4in1",t:"4in1",vn:11.1,vx:25.2,cc:60,bc:80,fw:"BLHeli_32",pr:["DShot300","DShot600"],w:12,mt:"30.5",s:["5in","6in","7in"]},
  {id:"e2",b:"T-Motor",m:"F55A Pro II",t:"4in1",vn:14.8,vx:25.2,cc:55,bc:65,fw:"BLHeli_32",pr:["DShot300","DShot600","DShot1200"],w:14,mt:"30.5",s:["5in","6in","7in"]},
  {id:"e3",b:"iFlight",m:"BLITZ E80",t:"4in1",vn:14.8,vx:51.8,cc:80,bc:100,fw:"AM32",pr:["DShot300","DShot600","DShot1200"],w:18,mt:"30.5",s:["5in","6in","7in","8in"]},
  {id:"e4",b:"SpeedyBee",m:"BLS 50A",t:"4in1",vn:11.1,vx:25.2,cc:50,bc:60,fw:"BLHeli_S",pr:["DShot300","DShot600"],w:8,mt:"30.5",s:["5in"]},
  {id:"e5",b:"HGLRC",m:"Zeus 80A AM32",t:"4in1",vn:14.8,vx:51.8,cc:80,bc:100,fw:"AM32",pr:["DShot300","DShot600","DShot1200"],w:17,mt:"30.5",s:["5in","6in","7in","8in"]},
  {id:"e6",b:"APD",m:"F Series 80F3",t:"single",vn:14.8,vx:51.8,cc:80,bc:120,fw:"APD",pr:["DShot600","PWM","CAN"],w:35,mt:"custom",s:["7in","8in","9in","10in","12in","13in"]},
  {id:"e7",b:"KDE Direct",m:"UAS HVC 85A",t:"single",vn:22.2,vx:51.8,cc:85,bc:110,fw:"KDE",pr:["PWM","CAN"],w:65,mt:"custom",s:["10in","12in","13in","15in"]},
  {id:"e8",b:"Castle",m:"Phoenix Edge 160",t:"single",vn:22.2,vx:50.4,cc:160,bc:200,fw:"Castle",pr:["PWM"],w:82,mt:"custom",s:["10in","12in","13in","15in"]},
  {id:"e9",b:"BetaFPV",m:"12A Toothpick",t:"4in1",vn:7.4,vx:14.8,cc:12,bc:15,fw:"BLHeli_S",pr:["DShot300","DShot600"],w:3,mt:"16",s:["2in","3in"]},
  {id:"e10",b:"Holybro",m:"Tekko32 45A",t:"4in1",vn:14.8,vx:25.2,cc:45,bc:55,fw:"BLHeli_32",pr:["DShot300","DShot600"],w:10,mt:"30.5",s:["5in","6in"]},
  {id:"e11",b:"Diatone",m:"Mamba F50 Pro",t:"4in1",vn:14.8,vx:25.2,cc:50,bc:65,fw:"BLHeli_32",pr:["DShot300","DShot600"],w:11,mt:"30.5",s:["5in","6in"]},
  {id:"e12",b:"BetaFPV",m:"F4 1S 5A AIO",t:"AIO",vn:3.7,vx:7.4,cc:5,bc:7,fw:"BLHeli_S",pr:["DShot300","DShot600"],w:2.8,mt:"25.5",s:["65mm","75mm","2in"]},
  {id:"e13",b:"T-Motor",m:"ALPHA 60A HV",t:"single",vn:22.2,vx:51.8,cc:60,bc:80,fw:"T-Motor FOC",pr:["PWM","CAN","DShot600"],w:75,mt:"custom",s:["8in","9in","10in","12in","13in"]},
  {id:"e14",b:"GEPRC",m:"TAKER G4 45A",t:"4in1",vn:14.8,vx:25.2,cc:45,bc:55,fw:"AM32",pr:["DShot300","DShot600"],w:10,mt:"30.5",s:["5in","6in"]},
];
const FCS=[
  {id:"fc1",b:"SpeedyBee",m:"F405 V4",mcu:"STM32F405",imu:"ICM42688P",vn:7.4,vx:25.2,u:6,fw:["Betaflight","INAV","ArduPilot"],mt:"30.5",w:7,s:["5in","6in","7in"]},
  {id:"fc2",b:"SpeedyBee",m:"F7 V3",mcu:"STM32F722",imu:"BMI270",vn:7.4,vx:25.2,u:7,fw:["Betaflight","INAV","ArduPilot"],mt:"30.5",w:9,s:["5in","6in","7in","8in"]},
  {id:"fc3",b:"Holybro",m:"Pixhawk 6X",mcu:"STM32H753",imu:"ICM42688P×3",vn:14.8,vx:51.8,u:8,fw:["PX4","ArduPilot"],mt:"Pixhawk",w:52,s:["7in","8in","9in","10in","12in","13in","15in"]},
  {id:"fc4",b:"CUAV",m:"Nora+",mcu:"STM32H743",imu:"ICM42688P×3",vn:14.8,vx:51.8,u:8,fw:["PX4","ArduPilot"],mt:"Pixhawk",w:48,s:["7in","8in","9in","10in","12in","13in","15in"]},
  {id:"fc5",b:"CubePilot",m:"Cube Orange+",mcu:"STM32H757",imu:"ICM42688+ICM20948",vn:14.8,vx:51.8,u:8,fw:["ArduPilot","PX4"],mt:"Cube",w:75,s:["9in","10in","12in","13in","15in"]},
  {id:"fc6",b:"iFlight",m:"Blitz F7 Pro",mcu:"STM32F722",imu:"BMI270",vn:7.4,vx:25.2,u:6,fw:["Betaflight","INAV"],mt:"30.5",w:8,s:["5in","6in","7in"]},
  {id:"fc7",b:"Matek",m:"H743-SLIM V3",mcu:"STM32H743",imu:"ICM42688P",vn:7.4,vx:36,u:7,fw:["ArduPilot","INAV","Betaflight"],mt:"30.5",w:10,s:["5in","6in","7in","8in","9in"]},
  {id:"fc8",b:"BetaFPV",m:"F4 1S AIO",mcu:"STM32F411",imu:"MPU6000",vn:3.7,vx:7.4,u:2,fw:["Betaflight"],mt:"25.5",w:3,s:["65mm","75mm","2in"]},
  {id:"fc9",b:"HGLRC",m:"Zeus H743",mcu:"STM32H743",imu:"ICM42688P",vn:7.4,vx:36,u:7,fw:["Betaflight","INAV","ArduPilot"],mt:"30.5",w:10,s:["5in","6in","7in","8in"]},
  {id:"fc10",b:"mRobotics",m:"Control Zero H7",mcu:"STM32H7",imu:"ICM20948",vn:14.8,vx:51.8,u:6,fw:["PX4","ArduPilot"],mt:"mRo",w:38,s:["7in","8in","9in","10in","12in","13in","15in"]},
  {id:"fc11",b:"Diatone",m:"Mamba MK4 F722",mcu:"STM32F722",imu:"ICM42688P",vn:14.8,vx:25.2,u:6,fw:["Betaflight","INAV"],mt:"30.5",w:8,s:["5in","6in"]},
  {id:"fc12",b:"Holybro",m:"Kakute H7 Mini",mcu:"STM32H743",imu:"BMI270",vn:7.4,vx:25.2,u:6,fw:["Betaflight","INAV"],mt:"20",w:6,s:["3in","3.5in","4in","5in"]},
];
const BATTS=[
  {id:"b1",b:"Tattu",m:"R-Line V5 1550 6S",c:6,v:22.2,cap:1550,dr:150,w:218,cn:"XT60",ch:"LiPo",s:["5in"]},
  {id:"b2",b:"Tattu",m:"R-Line V5 1300 6S",c:6,v:22.2,cap:1300,dr:150,w:195,cn:"XT60",ch:"LiPo",s:["5in"]},
  {id:"b3",b:"CNHL",m:"Black 1500 6S",c:6,v:22.2,cap:1500,dr:100,w:210,cn:"XT60",ch:"LiPo",s:["5in"]},
  {id:"b4",b:"GNB",m:"HV 660 4S",c:4,v:15.2,cap:660,dr:90,w:78,cn:"XT30",ch:"LiHV",s:["3in","4in"]},
  {id:"b5",b:"GNB",m:"530 1S HV",c:1,v:3.8,cap:530,dr:90,w:14,cn:"BT2.0",ch:"LiHV",s:["65mm","75mm","2in"]},
  {id:"b6",b:"Tattu",m:"Plus 16000 6S",c:6,v:22.2,cap:16000,dr:15,w:1950,cn:"AS150",ch:"LiPo",s:["10in","12in","13in"]},
  {id:"b7",b:"Molicel",m:"P42A 6S Pack",c:6,v:21.6,cap:4200,dr:10,w:420,cn:"XT60",ch:"Li-Ion",s:["7in","8in","9in"]},
  {id:"b8",b:"Tattu",m:"R-Line 1050 4S",c:4,v:14.8,cap:1050,dr:120,w:118,cn:"XT60",ch:"LiPo",s:["4in","5in"]},
  {id:"b9",b:"Tattu",m:"Smart 30000 14S",c:14,v:51.8,cap:30000,dr:35,w:8200,cn:"ACES",ch:"LiPo",s:["13in","15in"]},
  {id:"b10",b:"MaxAmps",m:"22000 12S",c:12,v:44.4,cap:22000,dr:25,w:5200,cn:"EC5",ch:"LiPo",s:["12in","13in","15in"]},
  {id:"b11",b:"CNHL",m:"10000 6S",c:6,v:22.2,cap:10000,dr:40,w:1280,cn:"XT90",ch:"LiPo",s:["8in","9in","10in"]},
  {id:"b12",b:"GNB",m:"850 3S",c:3,v:11.1,cap:850,dr:75,w:65,cn:"XT30",ch:"LiPo",s:["3in","3.5in","4in"]},
  {id:"b13",b:"Ovonic",m:"1550 6S",c:6,v:22.2,cap:1550,dr:100,w:228,cn:"XT60",ch:"LiPo",s:["5in","6in"]},
  {id:"b14",b:"Ovonic",m:"1550 4S",c:4,v:14.8,cap:1550,dr:100,w:174,cn:"XT60",ch:"LiPo",s:["5in"]},
  {id:"b15",b:"GNB",m:"1100 4S HV",c:4,v:15.2,cap:1100,dr:100,w:120,cn:"XT60",ch:"LiHV",s:["4in","5in"]},
];
const PROPS=[
  {id:"p1",b:"HQProp",m:"5x4.3x3 V2S",bl:3,d:5,pi:4.3,w:4.5,s:["5in"]},{id:"p2",b:"Gemfan",m:"51466 Hurricane",bl:3,d:5,pi:4.66,w:4.2,s:["5in"]},
  {id:"p3",b:"Ethix",m:"S5 Light",bl:3,d:5,pi:4.0,w:3.8,s:["5in"]},{id:"p4",b:"Gemfan",m:"3018 2-blade",bl:2,d:3,pi:1.8,w:1.2,s:["3in","3.5in"]},
  {id:"p5",b:"Gemfan",m:"2015 2-blade",bl:2,d:2,pi:1.5,w:0.5,s:["2in","65mm","75mm"]},{id:"p6",b:"HQProp",m:"4x3x3",bl:3,d:4,pi:3,w:2.8,s:["4in"]},
  {id:"p7",b:"HQProp",m:"7x3.5x3",bl:3,d:7,pi:3.5,w:8.5,s:["7in"]},{id:"p8",b:"Gemfan",m:"6030",bl:2,d:6,pi:3,w:5.0,s:["6in"]},
  {id:"p9",b:"T-Motor",m:"P9x3 CF",bl:2,d:9,pi:3,w:12,s:["9in"]},{id:"p10",b:"APC",m:"10x4.7 MR",bl:2,d:10,pi:4.7,w:15,s:["10in"]},
  {id:"p11",b:"T-Motor",m:"G28x9.2 CF",bl:2,d:28,pi:9.2,w:45,s:["12in","13in"]},{id:"p12",b:"T-Motor",m:"G40x13 CF",bl:2,d:40,pi:13.1,w:120,s:["15in"]},
  {id:"p13",b:"T-Motor",m:"P8x3 CF",bl:2,d:8,pi:3,w:10,s:["8in"]},{id:"p14",b:"DALPROP",m:"Cyclone T5045C",bl:3,d:5,pi:4.5,w:4.3,s:["5in"]},
];
const VTXS=[
  {id:"v1",b:"TBS",m:"Unify Pro32 HV",sys:"Analog",pw:[25,200,500,800],lat:1,w:7,vn:7.4,vx:25.2,s:["5in","6in","7in","8in"]},
  {id:"v2",b:"DJI",m:"O3 Air Unit",sys:"DJI",pw:[25,700],lat:14,w:21,vn:7.4,vx:25.2,s:["3.5in","4in","5in","6in","7in"]},
  {id:"v3",b:"DJI",m:"O4 Air Unit",sys:"DJI",pw:[25,1000],lat:12,w:18,vn:7.4,vx:25.2,s:["3.5in","4in","5in","6in","7in","8in"]},
  {id:"v4",b:"Walksnail",m:"Avatar HD V2",sys:"Walksnail",pw:[25,700,1200],lat:18,w:18,vn:7.4,vx:25.2,s:["4in","5in","6in","7in"]},
  {id:"v5",b:"HDZero",m:"Race V3",sys:"HDZero",pw:[25,200,400],lat:4,w:6,vn:7.4,vx:25.2,s:["4in","5in","6in"]},
  {id:"v6",b:"HDZero",m:"Freestyle V2",sys:"HDZero",pw:[25,200,500,1000],lat:4,w:9,vn:7.4,vx:25.2,s:["5in","6in","7in","8in"]},
  {id:"v7",b:"Rush",m:"Tank Solo",sys:"Analog",pw:[25,200,400,800],lat:1,w:5,vn:7.4,vx:25.2,s:["5in","6in","7in"]},
  {id:"v8",b:"HDZero",m:"Whoop Lite",sys:"HDZero",pw:[25,200],lat:4,w:3,vn:3.3,vx:7.4,s:["65mm","75mm","2in","3in"]},
];
const CAMS=[
  {id:"c1",b:"RunCam",m:"Phoenix 2 Joshua",sys:"Analog",w:7,s:["4in","5in","6in","7in"]},{id:"c2",b:"Foxeer",m:"Razer Mini",sys:"Analog",w:4,s:["3in","3.5in","4in","5in"]},
  {id:"c3",b:"Caddx",m:"Ratel 2 V2",sys:"Analog",w:7,s:["4in","5in","6in","7in"]},{id:"c4",b:"DJI",m:"O3 Camera",sys:"DJI",w:4,s:["3.5in","4in","5in","6in","7in"]},
  {id:"c5",b:"DJI",m:"O4 Camera",sys:"DJI",w:4,s:["3.5in","4in","5in","6in","7in","8in"]},{id:"c6",b:"RunCam",m:"HDZero Micro V3",sys:"HDZero",w:5,s:["4in","5in","6in","7in"]},
  {id:"c7",b:"Caddx",m:"Polar Starlight",sys:"Walksnail",w:5,s:["4in","5in","6in","7in"]},{id:"c8",b:"Caddx",m:"Ant Lite",sys:"Analog",w:2,s:["65mm","75mm","2in","3in"]},
];
const RXS=[
  {id:"r1",b:"HappyModel",m:"EP2 TCXO",pr:"ELRS",fr:"2.4G",w:1.2,s:["65mm","75mm","2in","3in","3.5in","4in","5in","6in","7in"]},
  {id:"r2",b:"RadioMaster",m:"RP1 ELRS",pr:"ELRS",fr:"2.4G",w:1.0,s:["65mm","75mm","2in","3in","3.5in","4in","5in","6in","7in"]},
  {id:"r3",b:"TBS",m:"Crossfire Nano",pr:"CRSF",fr:"915MHz",w:2,s:["3in","3.5in","4in","5in","6in","7in"]},
  {id:"r4",b:"FrSky",m:"R-XSR",pr:"SBUS",fr:"2.4G",w:1.5,s:["3in","3.5in","4in","5in","6in","7in"]},
  {id:"r5",b:"RadioMaster",m:"RP4TD Diversity",pr:"ELRS",fr:"2.4G",w:3.5,s:["5in","6in","7in","8in","9in"]},
  {id:"r6",b:"TBS",m:"Crossfire Diversity",pr:"CRSF",fr:"915MHz",w:8,s:["5in","6in","7in","8in","9in","10in"]},
];
const GPSS=[
  {id:"g1",b:"Holybro",m:"M10 Standard",chip:"u-blox M10",w:20,s:["5in","6in","7in","8in","9in","10in","12in","13in"]},
  {id:"g2",b:"Holybro",m:"H-RTK F9P",chip:"u-blox F9P",w:52,s:["7in","8in","9in","10in","12in","13in","15in"]},
  {id:"g3",b:"Beitian",m:"BN-880",chip:"u-blox M8N",w:18,s:["5in","6in","7in","8in"]},
  {id:"g4",b:"Matek",m:"M10Q-5883",chip:"u-blox M10",w:8,s:["4in","5in","6in","7in","8in"]},
  {id:"g5",b:"CUAV",m:"C-RTK 9P",chip:"u-blox F9P",w:55,s:["9in","10in","12in","13in","15in"]},
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
  var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setSize(W,H);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  var scene=new THREE.Scene();var camera=new THREE.PerspectiveCamera(38,W/H,0.01,100);
  var defTheta=0.785,defPhi=1.1,defRadius=0.5;
  var sph=new THREE.Spherical(cameraState.radius||defRadius,cameraState.phi||defPhi,cameraState.theta||defTheta);
  var off=new THREE.Vector3().setFromSpherical(sph);
  camera.position.copy(off);camera.lookAt(0,-0.002,0);
  var hC=isDark?[0xcce0ff,0x222233]:[0xffffff,0xdde0e6];
  scene.add(new THREE.HemisphereLight(hC[0],hC[1],isDark?0.5:0.7));
  var kl=new THREE.DirectionalLight(0xffffff,isDark?1.0:1.2);kl.position.set(2,3,2);scene.add(kl);
  scene.add(new THREE.DirectionalLight(isDark?0x88aaff:0xaaccff,0.3).translateX(-2).translateY(1).translateZ(-1));
  var gA=isDark?0x1a2030:0xaaaaaa,gB=isDark?0x111822:0xcccccc;
  var gh=new THREE.GridHelper(0.5,20,gA,gB);gh.position.y=-0.06;scene.add(gh);
  // Frame material color
  var frameColor=frameMat?(isDark?frameMat.color:frameMat.colorL):(isDark?0x1a1a1f:0x2a2a30);
  var frameMetalness=frameMat&&(frameMat.id==="al"||frameMat.id==="ti")?0.7:0.2;
  var cM=new THREE.MeshStandardMaterial({color:frameColor,roughness:0.4,metalness:frameMetalness});
  var mM=new THREE.MeshStandardMaterial({color:isDark?0x333340:0x555560,roughness:0.3,metalness:0.8});
  var cuM=new THREE.MeshStandardMaterial({color:0xb87333,roughness:0.5,metalness:0.7});
  var prM=new THREE.MeshStandardMaterial({color:isDark?0x333333:0x555555,roughness:0.4,transparent:true,opacity:0.65});
  var acC=isDark?0x5b9cf6:0x2d7be5;
  var aM=new THREE.MeshStandardMaterial({color:acC,roughness:0.4,metalness:0.5,emissive:isDark?0x0a1a33:0x081530,emissiveIntensity:0.3});
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
  var onWh=function(ev){ev.preventDefault();sDt*=(1+Math.sign(ev.deltaY)*0.08);};
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
    <div style={{position:"relative",width:"100%",aspectRatio:"4/3",background:t.canvas,borderRadius:16,overflow:"hidden",boxShadow:t.sh}}>
      <canvas ref={canvasRef} style={{width:"100%",height:"100%",display:"block",cursor:"grab"}}/>
      <div style={{position:"absolute",bottom:10,left:14,fontSize:9,color:t.td,fontFamily:MN,letterSpacing:0.8,opacity:0.6}}>Drag · Scroll to zoom</div>
      {frameType&&droneSize&&<div style={{position:"absolute",top:10,left:14,fontSize:10,color:t.ac,fontFamily:MN,fontWeight:600}}>{frameType.name} · {droneSize.l}{frameMat?" · "+frameMat.name:""}</div>}
    </div>);
}
function CompCard({item,type,onSelect,selected,rating}){
  var T=useTheme();var t=T.t;
  var bc=selected?(rating==="red"?t.rd:rating==="amber"?t.am:t.ac):(rating==="red"?t.rd+"44":rating==="amber"?t.am+"44":t.ac+"44");
  var bg=selected?(rating==="red"?t.rdL:rating==="amber"?t.amL:t.acL):t.sf;
  var dot=rating==="red"?t.rd:rating==="amber"?t.am:t.ac;
  var label=type==="motor"?item.kv+"KV · "+item.sz+" · "+item.w+"g · "+item.t+"g"
    :type==="esc"?item.cc+"A · "+item.fw+" · "+item.vn+"–"+item.vx+"V"
    :type==="fc"?item.mcu+" · "+item.fw.join("/")+" · "+item.w+"g"
    :type==="battery"?item.c+"S "+item.v+"V · "+item.cap+"mAh · "+item.dr+"C"
    :type==="prop"?item.d+"\" "+item.bl+"-blade · "+item.w+"g"
    :type==="vtx"?item.sys+" · "+item.pw.join("/")+"mW"
    :type==="camera"?item.sys+" · "+item.w+"g"
    :type==="rx"?item.pr+" "+item.fr+" · "+item.w+"g"
    :type==="gps"?item.chip+" · "+item.w+"g":"";
  return(<div onClick={function(){onSelect(item);}} style={{border:"1.5px solid "+bc,background:bg,borderRadius:10,padding:"10px 12px",cursor:"pointer",marginBottom:5,transition:"all 0.15s",position:"relative",boxShadow:selected?t.sh:"none"}}>
    <div style={{position:"absolute",top:8,right:8,width:7,height:7,borderRadius:"50%",background:dot,opacity:0.8}}/>
    <div style={{fontSize:12,fontWeight:600,color:t.tb,fontFamily:SN}}>{item.b} <span style={{color:t.ac,fontWeight:700}}>{item.m}</span></div>
    <div style={{fontSize:10,color:t.td,marginTop:3,fontFamily:MN,lineHeight:1.4}}>{label}</div>
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
function InfoTip({label}){
  var T=useTheme();var t=T.t;var def=PHYSICS_DEFS[label];if(!def)return null;
  var hs=useState(false),hovered=hs[0],setHovered=hs[1];
  return(<span onMouseEnter={function(){setHovered(true);}} onMouseLeave={function(){setHovered(false);}} style={{position:"relative",display:"inline-flex",alignItems:"center",marginLeft:4,cursor:"help"}}>
    <span style={{width:12,height:12,borderRadius:"50%",border:"1px solid "+t.td,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,color:t.td,fontFamily:SN,fontWeight:700,lineHeight:1,flexShrink:0}}>i</span>
    {hovered&&<div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",marginBottom:6,width:220,padding:"8px 10px",background:t.bg3,border:"1px solid "+t.bd,borderRadius:8,boxShadow:t.shH,fontSize:9,color:t.tx,lineHeight:1.5,fontFamily:SN,fontWeight:400,zIndex:20,pointerEvents:"none"}}>{def}</div>}
  </span>);
}
function MathPanel({insights,flight}){
  var T=useTheme();var t=T.t;if(!insights.length&&!flight)return null;
  return(<div style={{background:t.sf,borderRadius:14,boxShadow:t.sh,padding:16,fontFamily:MN}}>
    {insights.length>0&&<><div style={{fontSize:10,fontWeight:700,color:t.ac,letterSpacing:1.5,marginBottom:10}}>PHYSICS BREAKDOWN</div>
      {insights.map(function(ins,i){var vc=ins.type==="good"?t.ac:ins.type==="bad"?t.rd:ins.type==="warn"?t.am:t.tb;
        return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid "+t.bdL}}>
          <div style={{display:"flex",alignItems:"center"}}><div><div style={{fontSize:10,color:t.tb,fontWeight:500}}>{ins.label}<InfoTip label={ins.label}/></div><div style={{fontSize:8,color:t.td,marginTop:1}}>{ins.formula}</div></div></div>
          <div style={{fontSize:13,fontWeight:700,color:vc}}>{ins.value}</div></div>;})}</>}
    {flight&&<><div style={{fontSize:10,fontWeight:700,color:t.bl,letterSpacing:1.5,marginTop:insights.length?14:0,marginBottom:10}}>FLIGHT ESTIMATES</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div style={{textAlign:"center",background:t.acL,borderRadius:10,padding:10}}><div style={{fontSize:24,fontWeight:800,color:t.ac}}>{flight.hoverTime}<span style={{fontSize:10,fontWeight:400}}>min</span></div><div style={{fontSize:8,color:t.td,marginTop:2}}>HOVER</div></div>
        <div style={{textAlign:"center",background:t.blL,borderRadius:10,padding:10}}><div style={{fontSize:24,fontWeight:800,color:t.bl}}>{flight.cruiseTime}<span style={{fontSize:10,fontWeight:400}}>min</span></div><div style={{fontSize:8,color:t.td,marginTop:2}}>CRUISE</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4}}>
        {[[flight.auw+"g","AUW",t.tb],[flight.twr+":1","T/W",flight.twr>=4?t.ac:flight.twr>=2?t.am:t.rd],[flight.hoverThrottle+"%","THR",t.tb],[flight.hoverPower+"W","PWR",t.tb]].map(function(r,i){
          return <div key={i} style={{background:t.bg2,borderRadius:8,padding:"6px 4px",textAlign:"center"}}><div style={{fontWeight:700,fontSize:13,color:r[2]}}>{r[0]}</div><div style={{fontSize:7,color:t.td,marginTop:1}}>{r[1]}</div></div>;})}</div>
      <div style={{marginTop:8,fontSize:8,color:t.td,lineHeight:1.6}}>
        {Object.entries(flight.breakdown).map(function(en){return <div key={en[0]} style={{display:"flex",justifyContent:"space-between"}}><span>{en[0].charAt(0).toUpperCase()+en[0].slice(1)}</span><span>{en[1]}g</span></div>;})}
        <div style={{borderTop:"1px solid "+t.bd,marginTop:3,paddingTop:3,fontWeight:700,color:t.tb,display:"flex",justifyContent:"space-between"}}><span>AUW</span><span>{flight.auw}g</span></div>
        <div style={{marginTop:4,fontSize:7,color:t.td}}>ρ={flight.rho} · FM={flight.FM} · {flight.altitude}m ASL</div></div></>}
  </div>);
}
function IssuesPanel({compat}){var T=useTheme();var t=T.t;if(!compat)return null;var e=compat.errors,w=compat.warnings;
  if(!e.length&&!w.length)return <div style={{padding:10,background:t.acL,borderRadius:10,fontSize:10,color:t.ac,textAlign:"center",fontFamily:MN}}>✓ Compatible</div>;
  return(<div style={{display:"flex",flexDirection:"column",gap:4}}>
    {e.map(function(x,i){return <div key={"e"+i} style={{padding:"7px 12px",background:t.rdL,borderRadius:8,fontSize:9,color:t.rd,fontFamily:MN,lineHeight:1.4}}>✕ {x.msg}</div>;})}
    {w.map(function(x,i){return <div key={"w"+i} style={{padding:"7px 12px",background:t.amL,borderRadius:8,fontSize:9,color:t.am,fontFamily:MN,lineHeight:1.4}}>⚠ {x.msg}</div>;})}
  </div>);
}

// ════════════════════════════════════════════════════
// LANDING
// ════════════════════════════════════════════════════
function LandingPage({onLaunch}){
  var T=useTheme();var t=T.t;var isDark=T.mode==="dark";
  var ns=useState(false),navOpen=ns[0],setNavOpen=ns[1];
  return(<div style={{background:t.bg,color:t.tx,fontFamily:SN,minHeight:"100vh"}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"14px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",background:t.bg+"e6",backdropFilter:"blur(16px)",borderBottom:"1px solid "+t.bd}}>
      <div style={{fontFamily:MN,fontWeight:700,fontSize:15,letterSpacing:1.2}}><span style={{color:t.tb}}>Multirotor</span><span style={{color:t.ac}}>.</span><span style={{color:t.tb}}>build</span></div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <button onClick={function(){T.toggle();}} style={{background:t.sf,border:"1px solid "+t.bd,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,color:t.td}}>{isDark?"☀":"☾"}</button>
        <button onClick={function(){setNavOpen(!navOpen);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:3}}>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(45deg) translateY(5px)":"none"}}/>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",opacity:navOpen?0:1}}/>
          <span style={{display:"block",width:20,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(-45deg) translateY(-5px)":"none"}}/>
        </button></div>
    </nav>
    {navOpen&&<div style={{position:"fixed",top:52,right:16,zIndex:49,background:t.sf,borderRadius:14,boxShadow:t.shH,padding:"8px 0",minWidth:200,border:"1px solid "+t.bd}}>
      {["About","Documentation","Compatibility Guide","GitHub"].map(function(item){return <div key={item} onClick={function(){setNavOpen(false);}} style={{padding:"10px 20px",fontSize:13,color:t.tb,cursor:"pointer",fontWeight:500}}>{item}</div>;})}
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
function BuilderApp({goHome}){
  var T=useTheme();var t=T.t;var isDark=T.mode==="dark";
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
  var fm=useState(FRAME_MATERIALS[0]),frameMat=fm[0],setFrameMat=fm[1];

  var handleSelect=function(type,item){setSel(function(prev){var n={};for(var k in prev)n[k]=prev[k];n[type]=prev[type]&&prev[type].id===item.id?null:item;return n;});};
  var resetAll=function(){setSel(emptySel);};

  var compat=useMemo(function(){var filled=Object.values(sel).filter(Boolean);if(filled.length<2)return null;return checkCompat(sel,size,frame,frameMat);},[sel,size,frame,frameMat]);
  var flight=useMemo(function(){return calcFlight(sel,size,frame,battPos,altitude,fcPos,escPos,frameMat);},[sel,size,frame,battPos,altitude,fcPos,escPos,frameMat]);
  var insights=useMemo(function(){return getMathInsights(sel,size,frame,fcPos,escPos,frameMat);},[sel,size,frame,fcPos,escPos,frameMat]);
  var getStatus=function(type){if(!compat)return null;if(compat.errors.some(function(e){return e.c.indexOf(type)>=0;}))return"error";if(compat.warnings.some(function(w){return w.c.indexOf(type)>=0;}))return"warning";return sel[type]?"ok":null;};
  var tabs=[{k:"motor",l:"Motors",db:MOTORS},{k:"esc",l:"ESCs",db:ESCS},{k:"fc",l:"FC",db:FCS},{k:"battery",l:"Battery",db:BATTS},{k:"prop",l:"Props",db:PROPS},{k:"vtx",l:"VTX",db:VTXS},{k:"camera",l:"Camera",db:CAMS},{k:"rx",l:"RX",db:RXS},{k:"gps",l:"GPS",db:GPSS}];
  var currentTab=tabs.find(function(t2){return t2.k===tab;});
  var sizeFiltered=size?currentTab.db.filter(function(it){return it.s&&it.s.indexOf(size.id)>=0;}):currentTab.db;
  var otherItems=currentTab.db.filter(function(it){return sizeFiltered.indexOf(it)<0;});
  function sortByRating(items){var rated=items.map(function(it){return{item:it,rating:rateComponent(it,tab,sel,size,frame,frameMat)};});
    return{greens:rated.filter(function(r){return r.rating==="green";}),ambers:rated.filter(function(r){return r.rating==="amber";}),reds:rated.filter(function(r){return r.rating==="red";})};
  }
  var recommended=sortByRating(sizeFiltered);var otherSorted=sortByRating(otherItems);

  return(<div style={{minHeight:"100vh",background:t.bg,color:t.tx,fontFamily:SN}}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
    {showUpload&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:t.bg3,borderRadius:20,padding:28,maxWidth:500,width:"90%",maxHeight:"80vh",overflowY:"auto",boxShadow:t.shH}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><div style={{fontSize:16,fontWeight:700,color:t.ac}}>Upload Component</div>
          <button onClick={function(){setShowUpload(false);}} style={{background:"none",border:"none",color:t.td,fontSize:20,cursor:"pointer"}}>×</button></div>
        <div style={{fontSize:11,color:t.td,lineHeight:1.6,marginBottom:14}}>Fork github.com/lazyonbed/multirotor-build, add JSON to componentDatabase.js, open a PR.</div>
        {Object.entries(UPSCH).map(function(en){return <div key={en[0]} style={{background:t.bg2,borderRadius:10,padding:12,marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:t.ac,marginBottom:4,textTransform:"uppercase"}}>{en[0]}</div>
          <div style={{fontSize:9,color:t.td,fontFamily:MN}}>{en[1].req.join(", ")}</div><div style={{fontSize:9,color:t.td,marginTop:4}}>{en[1].doc}</div></div>;})}
      </div></div>}
    {/* Header */}
    <div style={{padding:"10px 24px",borderBottom:"1px solid "+t.bd,display:"flex",justifyContent:"space-between",alignItems:"center",background:t.bg+"e6",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
      <div onClick={goHome} style={{fontFamily:MN,fontWeight:700,fontSize:14,letterSpacing:1.2,cursor:"pointer"}}><span style={{color:t.tb}}>Multirotor</span><span style={{color:t.ac}}>.</span><span style={{color:t.tb}}>build</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {step===1&&<button onClick={function(){setStep(0);}} style={{background:t.sf,border:"1px solid "+t.bd,color:t.td,padding:"5px 14px",borderRadius:8,cursor:"pointer",fontSize:10,fontFamily:SN,fontWeight:500}}>← Frame</button>}
        <button onClick={function(){T.toggle();}} style={{background:t.sf,border:"1px solid "+t.bd,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,color:t.td}}>{isDark?"☀":"☾"}</button>
        <button onClick={function(){setNavOpen(!navOpen);}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",flexDirection:"column",gap:3}}>
          <span style={{display:"block",width:18,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(45deg) translateY(5px)":"none"}}/>
          <span style={{display:"block",width:18,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",opacity:navOpen?0:1}}/>
          <span style={{display:"block",width:18,height:2,background:t.tb,borderRadius:1,transition:"all 0.3s",transform:navOpen?"rotate(-45deg) translateY(-5px)":"none"}}/>
        </button></div>
    </div>
    {navOpen&&<div style={{position:"fixed",top:48,right:16,zIndex:39,background:t.sf,borderRadius:14,boxShadow:t.shH,padding:"8px 0",minWidth:190,border:"1px solid "+t.bd}}>
      {[{l:"Home",fn:function(){goHome();setNavOpen(false);}},{l:"About",fn:function(){setNavOpen(false);}},{l:"Documentation",fn:function(){setNavOpen(false);}},{l:"Compatibility Guide",fn:function(){setNavOpen(false);}}].map(function(item){
        return <div key={item.l} onClick={item.fn} style={{padding:"10px 20px",fontSize:12,color:t.tb,cursor:"pointer",fontWeight:500}}>{item.l}</div>;
      })}
    </div>}

    {step===0&&(<div style={{padding:"28px 24px",maxWidth:900,margin:"0 auto"}}>
      <div style={{marginBottom:28}}><div style={{fontSize:11,fontWeight:700,color:t.ac,marginBottom:12,letterSpacing:1.5,fontFamily:MN}}>① Frame Type</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))",gap:8}}>
          {FRAME_TYPES.map(function(ft){var a=frame&&frame.id===ft.id;return <div key={ft.id} onClick={function(){setFrame(ft);}} style={{padding:"12px 8px",background:a?t.acL:t.sf,border:"1.5px solid "+(a?t.ac:t.bd),borderRadius:12,cursor:"pointer",textAlign:"center",boxShadow:a?t.sh:"none"}}>
            <div style={{fontSize:12,fontWeight:700,color:a?t.ac:t.tb}}>{ft.name}</div><div style={{fontSize:8,color:t.td,marginTop:3}}>{ft.mc}m · {ft.desc}</div></div>;})}</div></div>
      <div style={{marginBottom:28}}><div style={{fontSize:11,fontWeight:700,color:t.bl,marginBottom:12,letterSpacing:1.5,fontFamily:MN}}>② Size</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {SIZES.map(function(s){var a=size&&size.id===s.id;return <div key={s.id} onClick={function(){setSize(s);}} style={{padding:"8px 14px",background:a?t.blL:t.sf,border:"1.5px solid "+(a?t.bl:t.bd),borderRadius:10,cursor:"pointer",boxShadow:a?t.sh:"none"}}>
            <div style={{fontSize:14,fontWeight:800,color:a?t.bl:t.tb,fontFamily:MN}}>{s.l}</div><div style={{fontSize:9,color:t.td}}>{s.mm}mm · {s.cat}</div></div>;})}</div></div>
      <div style={{marginBottom:28}}><div style={{fontSize:11,fontWeight:700,color:t.ac,marginBottom:12,letterSpacing:1.5,fontFamily:MN}}>③ Frame Material</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))",gap:8}}>
          {FRAME_MATERIALS.map(function(mat){var a=frameMat&&frameMat.id===mat.id;return <div key={mat.id} onClick={function(){setFrameMat(mat);}} style={{padding:"12px 10px",background:a?t.acL:t.sf,border:"1.5px solid "+(a?t.ac:t.bd),borderRadius:12,cursor:"pointer",boxShadow:a?t.sh:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:12,fontWeight:700,color:a?t.ac:t.tb}}>{mat.name}</div><span style={{fontSize:9,color:t.td}}>{mat.cost}</span></div>
            <div style={{fontSize:8,color:t.td,marginTop:3}}>{mat.desc}</div>
            <div style={{fontSize:8,color:t.td,marginTop:2,fontFamily:MN}}>Density: {mat.df}× · Stiffness: {Math.round(mat.stiffness*100)}%</div>
          </div>;})}</div></div>
      {frame&&size&&frameMat&&<button onClick={function(){setSel(emptySel);setStep(1);}} style={{background:t.ac,color:"#fff",border:"none",padding:"13px 36px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:SN,boxShadow:"0 4px 16px "+t.ac+"33"}}>Start Building →</button>}
    </div>)}

    {step===1&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",height:"calc(100vh - 50px)"}}>
      <div style={{padding:"14px 18px",borderRight:"1px solid "+t.bd,overflowY:"auto",background:t.bg}}>
        <DroneViewer frameType={frame} droneSize={size} selections={sel} batteryPos={battPos} fcPos={fcPos} escPos={escPos} frameMat={frameMat}/>
        <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
          <span style={{fontSize:9,color:t.td,fontFamily:MN}}>FC:</span>
          {["above","between","below"].map(function(p){return <button key={"fc"+p} onClick={function(){setFcPos(p);}} style={{padding:"3px 10px",borderRadius:6,fontSize:9,cursor:"pointer",fontFamily:SN,fontWeight:500,background:fcPos===p?t.acL:t.sf,border:"1px solid "+(fcPos===p?t.ac:t.bd),color:fcPos===p?t.ac:t.td}}>{p}</button>;})}
          <span style={{fontSize:9,color:t.td,fontFamily:MN,marginLeft:8}}>ESC:</span>
          {["above","between","below"].map(function(p){return <button key={"esc"+p} onClick={function(){setEscPos(p);}} style={{padding:"3px 10px",borderRadius:6,fontSize:9,cursor:"pointer",fontFamily:SN,fontWeight:500,background:escPos===p?t.acL:t.sf,border:"1px solid "+(escPos===p?t.ac:t.bd),color:escPos===p?t.ac:t.td}}>{p}</button>;})}
          {sel.battery&&<><span style={{fontSize:9,color:t.td,fontFamily:MN,marginLeft:8}}>Batt:</span>
            {["top","between","bottom"].map(function(p){return <button key={p} onClick={function(){setBattPos(p);}} style={{padding:"3px 10px",borderRadius:6,fontSize:9,cursor:"pointer",fontFamily:SN,fontWeight:500,background:battPos===p?t.acL:t.sf,border:"1px solid "+(battPos===p?t.ac:t.bd),color:battPos===p?t.ac:t.td}}>{p}</button>;})}</>}
        </div>
        <div style={{marginTop:6,display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:9,color:t.td,fontFamily:MN}}>Alt:</span>
          <input type="range" min={0} max={5000} step={100} value={altitude} onChange={function(e){setAltitude(+e.target.value);}} style={{flex:1,accentColor:t.ac}}/>
          <span style={{fontSize:10,color:t.ac,fontFamily:MN,minWidth:40}}>{altitude}m</span>
        </div>
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>
          {tabs.map(function(tb2){var s=sel[tb2.k],st2=getStatus(tb2.k);
            var pBg=s?(st2==="error"?t.rdL:st2==="warning"?t.amL:t.acL):t.sf;
            var pC=s?(st2==="error"?t.rd:st2==="warning"?t.am:t.ac):t.td;
            return <div key={tb2.k} onClick={function(){setTab(tb2.k);}} style={{padding:"3px 10px",borderRadius:20,fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:SN,background:pBg,color:pC,border:"1px solid "+pC+"33"}}>{s?s.b+" "+s.m:tb2.l}</div>;})}
        </div>
        <div style={{marginTop:8}}><IssuesPanel compat={compat}/></div>
        <div style={{marginTop:8}}><MathPanel insights={insights} flight={flight}/></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",background:t.bg2}}>
        <div style={{display:"flex",borderBottom:"1px solid "+t.bd,alignItems:"center",padding:"0 4px",background:t.bg2}}>
          <div style={{display:"flex",flex:1,overflowX:"auto"}}>
            {tabs.map(function(tb2){var active=tab===tb2.k;var st2=getStatus(tb2.k);
              return <button key={tb2.k} onClick={function(){setTab(tb2.k);}} style={{padding:"10px 6px",background:active?t.sf:"transparent",border:"none",borderBottom:"2px solid "+(active?t.ac:"transparent"),
                color:active?t.ac:st2==="error"?t.rd:st2==="warning"?t.am:st2==="ok"?t.ac:t.td,
                fontSize:10,fontWeight:active?700:400,cursor:"pointer",fontFamily:SN,whiteSpace:"nowrap",minWidth:50}}>{tb2.l}</button>;})}
          </div>
          <div style={{display:"flex",gap:4,paddingRight:4}}>
            <button onClick={function(){setShowUpload(true);}} style={{background:"none",border:"1px solid "+t.bd,color:t.td,padding:"4px 8px",borderRadius:6,cursor:"pointer",fontSize:9,fontFamily:SN,whiteSpace:"nowrap"}}>+ Upload</button>
            <button onClick={resetAll} style={{background:"none",border:"1px solid "+t.bd,color:t.rd,padding:"4px 8px",borderRadius:6,cursor:"pointer",fontSize:9,fontFamily:SN,whiteSpace:"nowrap"}}>Reset All</button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>
          {sizeFiltered.length>0&&<><div style={{fontSize:9,color:t.td,marginBottom:6,letterSpacing:1,fontFamily:MN,fontWeight:500}}>RECOMMENDED FOR {size?size.l.toUpperCase():""}</div>
            {recommended.greens.slice(0,3).map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="green"/>;})}
            {recommended.ambers.slice(0,3).map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="amber"/>;})}
            {recommended.reds.slice(0,3).map(function(r){return <CompCard key={r.item.id} item={r.item} type={tab} selected={sel[tab]&&sel[tab].id===r.item.id} onSelect={function(it){handleSelect(tab,it);}} rating="red"/>;})}
          </>}
          {otherItems.length>0&&<><div style={{fontSize:9,color:t.td,marginTop:14,marginBottom:6,letterSpacing:1,fontFamily:MN,fontWeight:500}}>OTHER OPTIONS</div>
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
// ROOT
// ════════════════════════════════════════════════════
export default function App(){
  var ps=useState("landing"),page=ps[0],setPage=ps[1];
  var ms=useState("dark"),mode=ms[0],setMode=ms[1];
  var t=mode==="dark"?DARK:LIGHT;
  var ctx={t:t,mode:mode,toggle:function(){setMode(mode==="dark"?"light":"dark");}};
  var goHome=function(){setPage("landing");};
  return(<ThemeCtx.Provider value={ctx}>
    {page==="landing"?<LandingPage onLaunch={function(){setPage("builder");}}/>:<BuilderApp goHome={goHome}/>}
  </ThemeCtx.Provider>);
}
