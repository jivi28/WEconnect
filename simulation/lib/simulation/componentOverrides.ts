import type { WEComponent } from "@/lib/types";

/**
 * Manual override map for component data.
 *
 * Any component ID (= the WEComponents/ folder name, exactly as it appears in
 * `folders` / as the component `id`) listed here has the given fields merged on
 * top of the auto-generated data — overriding name, description, hint, etc.
 *
 * Use the real WEComponent field names. Note: the description field is called
 * `shortDescription` (the `description` you see in WE_PRODUCT_LOOKUP is mapped
 * into `shortDescription` during generation). Common fields to override:
 *   name · shortDescription · hint · category · subcategory
 *
 * Anything not listed here keeps its auto-generated value.
 */
export const COMPONENT_OVERRIDES: Partial<Record<string, Partial<WEComponent>>> = {
  // Example — key is the exact folder name (component id). Uncomment + edit:
  // "WE-LQ SMT Inductor": {
  //   name: "WE-LQ SMT Inductor",
  //   shortDescription: "Your custom description here.",
  //   hint: "Your custom hint here.",
  // },

  // Add more below...

  // --- SNAP FERRITES (WE-STAR series) ---
  "STP_WE-STAR-BUENO": {
    name: "WE-STAR BUENO Snap Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "Snap-on ferrite core for cable EMI suppression, BUENO geometry for standard round cables.",
    hint: "Snap around power or signal cables at the point where they exit an enclosure to suppress conducted EMI without cutting the cable.",
  },
  "STP_WE-STAR-FLAT": {
    name: "WE-STAR FLAT Snap Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "Flat snap-on ferrite for ribbon cables and flat flexible conductors.",
    hint: "Clamp onto flat ribbon cables or FFC connectors to suppress common-mode noise across all conductors simultaneously.",
  },
  "STP_WE-STAR-GAP": {
    name: "WE-STAR GAP Snap Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "Snap ferrite with air gap for cables with larger outer diameters or multiple conductors.",
    hint: "Use when a standard snap ferrite won't close fully — the gap geometry accommodates thicker cable bundles while still providing effective EMI attenuation.",
  },
  "STP_WE-STAR-Ring": {
    name: "WE-STAR Ring Snap Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "Ring-shaped snap ferrite providing 360° EMI suppression coverage around cable bundles.",
    hint: "Slide over cable harnesses before connector termination for full circumferential EMI shielding — more effective than split-core designs at high frequencies.",
  },
  "STP_WE-START-TEC": {
    name: "WE-STAR TEC Snap Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "TEC-geometry snap ferrite optimised for broadband noise suppression on power cables.",
    hint: "Apply to mains power cables in industrial equipment to suppress broadband EMI from switching converters across a wide frequency range.",
  },
  "STP_WEStarTecLFS": {
    name: "WE-STAR TEC LFS Snap Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "Low-frequency snap ferrite for suppression of EMI below 1 MHz on power and motor cables.",
    hint: "Use on motor drive output cables where low-frequency switching noise must be attenuated — the LFS core material is optimised for sub-MHz EMI suppression.",
  },

  // --- SHIELDING MECHANICAL ---
  "Shielding Cabinet Clip": {
    name: "Shielding Cabinet Clip",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Mechanical clip for securing WE-SHC shielding cabinet lids with reliable electrical contact.",
    hint: "Use to fasten shielding cabinet covers to their frames — ensures consistent low-impedance contact around the full perimeter for effective RF containment.",
  },
  "earthing belt": {
    name: "Earthing Belt",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Conductive earthing strap for bonding PCB ground planes to chassis or enclosure walls.",
    hint: "Connect between PCB ground and chassis at multiple points to reduce ground loop impedance and prevent EMI from coupling into the system.",
  },
  "WE-RIB": {
    name: "WE-RIB Conductive Ribbon",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Flexible conductive ribbon for low-impedance grounding connections between PCBs and enclosures.",
    hint: "Use as a flexible ground strap between moving or vibrating assemblies where a rigid ground connection would fracture under mechanical stress.",
  },

  // --- INTERFERENCE SUPPRESSION CAPACITORS (WCAP) ---
  "WCAP-CSSA Interference Suppression": {
    name: "WCAP-CSSA Safety MLCC Interference Suppression",
    category: "EMC Components",
    subcategory: "Interference Suppression Capacitors",
    shortDescription: "Class X/Y safety-rated multilayer ceramic capacitor for mains interference suppression.",
    hint: "Place across mains supply lines (X-cap) or between line and earth (Y-cap) to suppress conducted EMI — safety rated to withstand mains transients without failure.",
  },
  "WCAP-FTX2 Film Capacitors": {
    name: "WCAP-FTX2 Film Capacitor (X2 Class)",
    category: "EMC Components",
    subcategory: "Interference Suppression Capacitors",
    shortDescription: "Class X2 rated MKP film capacitor for across-the-line mains EMI suppression.",
    hint: "Connect line-to-line on AC mains inputs — X2 rating means safe failure mode if the capacitor breaks down under mains surge conditions.",
  },
  "WCAP-FTXH Film Capacitors": {
    name: "WCAP-FTXH Film Capacitor (XH Class)",
    category: "EMC Components",
    subcategory: "Interference Suppression Capacitors",
    shortDescription: "High-capacitance Class X MKP film capacitor for aggressive mains differential noise filtering.",
    hint: "Use where higher capacitance values are needed for differential mode filtering — XH class provides greater noise attenuation than standard X2 at the cost of larger size.",
  },
  "WCAP-FTXX Film Capacitors": {
    name: "WCAP-FTXX Film Capacitor (MKP)",
    category: "EMC Components",
    subcategory: "Interference Suppression Capacitors",
    shortDescription: "General purpose MKP film capacitor for AC mains interference suppression applications.",
    hint: "Versatile across-the-line capacitor for mains EMI filters — MKP construction provides stable capacitance and low ESR across a wide temperature range.",
  },
  "WCAP-FTY2 Film Capacitors": {
    name: "WCAP-FTY2 Film Capacitor (Y2 Class)",
    category: "EMC Components",
    subcategory: "Interference Suppression Capacitors",
    shortDescription: "Class Y2 safety-rated film capacitor for line-to-earth mains interference suppression.",
    hint: "Connect between live/neutral and earth ground — Y2 rating guarantees safe open-circuit failure mode, essential for equipment where capacitor failure could present a shock hazard.",
  },

  // --- WE-AFB AXIAL FERRITE BEADS ---
  "WE-AFB": {
    name: "WE-AFB EMI Suppression Axial Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "Axial through-hole ferrite bead for broadband EMI suppression on PCB signal and power lines.",
    hint: "Thread onto component leads or wire before soldering to add EMI suppression on power supply rails and signal lines in through-hole designs.",
  },
  "WE-AFB LFS": {
    name: "WE-AFB LFS EMI Suppression Axial Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "Low-frequency axial ferrite bead optimised for noise suppression in the 100 kHz–10 MHz range.",
    hint: "Use on power supply input leads where switching converter noise below 10 MHz is the primary concern — LFS material provides higher impedance at lower frequencies than standard grades.",
  },

  // --- WE-CCMF CERAMIC COMMON MODE FILTER ---
  "WE-CCMF Ceramic Common Mode Filter": {
    name: "WE-CCMF Ceramic Common Mode Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "Ceramic integrated common mode filter with built-in ESD protection for data interface lines.",
    hint: "Place on USB-C, HDMI, or DisplayPort lines — the ceramic construction integrates both common-mode filtering and ESD clamping in a single ultra-compact package.",
  },
  "WE-CCMF Common Mode Filter": {
    name: "WE-CCMF Common Mode Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "Ceramic common mode filter for differential signal line EMC compliance and ESD protection.",
    hint: "Single component solution for data line EMC — suppresses common-mode noise while passing differential signals with minimal insertion loss.",
  },

  // --- WE-CLFS LINE FILTER ---
  "WE-CLFS Line Filter": {
    name: "WE-CLFS Complete Line Filter System",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Integrated single or two-stage mains line filter combining common-mode choke and capacitors in one housing.",
    hint: "Drop-in complete mains EMC filter solution — replaces the discrete choke + capacitor filter network with a single certified module, saving board space and design time.",
  },

  // --- WE-CMB VARIANTS ---
  "WE-CMB HV Common Mode Power Line Choke": {
    name: "WE-CMB HV Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "High-voltage rated common mode choke for mains filtering in 400V+ industrial applications.",
    hint: "Required for industrial 3-phase equipment — rated for 400V AC mains and above to filter common-mode currents while withstanding full mains voltage stress.",
  },
  "We-CMB NiZn Common Mode Power Line Choke": {
    name: "WE-CMB NiZn Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "NiZn ferrite core common mode choke for high-frequency mains noise suppression above 10 MHz.",
    hint: "Choose over standard MnZn types when switching converter harmonics extend above 10 MHz — NiZn core material maintains high impedance at higher frequencies.",
  },
  "WE-CMBH Commmon Mode Power Line Choke(Verticale)": {
    name: "WE-CMBH Common Mode Power Line Choke (Vertical)",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Vertical-mount common mode choke for through-hole mains power line EMI filtering.",
    hint: "Select when PCB footprint area is limited but height is available — vertical orientation reduces the PCB area used compared to horizontal-mount variants.",
  },
  "WE-CMBNC Common Mode Power Line Choke Nanocrystalline": {
    name: "WE-CMBNC Common Mode Power Line Choke Nanocrystalline",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Nanocrystalline core common mode choke with superior low-frequency EMI filtering performance.",
    hint: "Use in EV chargers and industrial power supplies where very low-frequency common-mode noise below 150 kHz must be attenuated — nanocrystalline cores outperform ferrite at these frequencies.",
  },

  // --- WE-CNSW ---
  "WE-CNSW HF SMT Common Mode Line Filter": {
    name: "WE-CNSW HF SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "High-frequency SMT common mode filter for GHz-range EMC compliance on fast data interfaces.",
    hint: "Place on USB 3.0, HDMI 2.0, or PCIe lanes — HF variant maintains high common-mode impedance above 1 GHz while keeping differential insertion loss below 1 dB.",
  },
  "WE-CNSW SMT Common Mode Line Filter Extended": {
    name: "WE-CNSW SMT Common Mode Line Filter (Extended)",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "Extended-range SMT common mode filter covering a broader frequency band for versatile data line EMC filtering.",
    hint: "Use when the noise spectrum is unknown or broad — the extended variant covers both low and high frequency common-mode noise in a single component.",
  },

  // --- EMC SHIELDING COMPONENTS ---
  "WE-CPU EMI Suppression CPU Ferrite Plate": {
    name: "WE-CPU EMI Suppression CPU Ferrite Plate",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Flat ferrite plate for absorbing EMI radiated by CPU and processor modules on PCBs.",
    hint: "Place directly over a CPU, FPGA, or microcontroller to absorb near-field EMI radiation — prevents switching noise from coupling into adjacent circuitry or radiating from the PCB.",
  },
  "WE-CSGS Contact Spring Gasket": {
    name: "WE-CSGS Contact Spring Gasket",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Beryllium copper contact spring gasket for continuous EMI shielding around enclosure seams.",
    hint: "Install along PCB shield frame edges or enclosure seam joints to maintain low-impedance electrical contact and prevent EMI leakage through gaps.",
  },
  "WE-EGS Conductive Elastomer Gasket": {
    name: "WE-EGS Conductive Elastomer Gasket",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Conductive elastomer gasket combining EMI shielding with environmental sealing.",
    hint: "Use on enclosure door seams or panel joints where both EMI shielding and IP-rated sealing against dust and moisture are required simultaneously.",
  },
  "WE-EMIP EMI Patch": {
    name: "WE-EMIP EMI Patch",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Self-adhesive EMI absorber patch for suppressing near-field radiation from PCB hotspots.",
    hint: "Apply directly onto radiating components (oscillators, switching ICs, high-speed traces) after assembly to reduce near-field emissions without PCB redesign.",
  },
  "WE-FAS Flexible Absorber Sheet": {
    name: "WE-FAS Flexible Absorber Sheet",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Flexible broadband electromagnetic absorber sheet for absorbing microwave and RF energy.",
    hint: "Cut to shape and apply inside enclosures or on PCBs to absorb GHz-range EMI from antennas, RF modules, or high-speed interfaces — reduces multipath reflections in wireless products.",
  },
  "WE-FSFS Flexible Sintered Ferrite Sheet": {
    name: "WE-FSFS Flexible Sintered Ferrite Sheet",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Flexible sintered ferrite sheet for near-field magnetic shielding and NFC antenna decoupling.",
    hint: "Place between an NFC antenna and a metal enclosure or battery to prevent the metal from detuning the antenna — the ferrite channels the magnetic flux and improves NFC read range.",
  },
  "WE-LS Conductive Foam": {
    name: "WE-LS Conductive Foam",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Conductive foam gasket material for compliant EMI sealing of irregular or uneven mating surfaces.",
    hint: "Use where mating surfaces are not perfectly flat — the foam compresses to fill gaps and maintain continuous electrical contact for EMI shielding across the joint.",
  },
  "WE-LT Conductive Shielding Gasket": {
    name: "WE-LT Conductive Shielding Gasket",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Knitted wire mesh gasket for high-performance EMI shielding of enclosure seams and panel joints.",
    hint: "Install in machined grooves on enclosure flanges for MIL-grade EMI shielding — knitted wire mesh provides lower impedance contact than foam or elastomer gaskets at high frequencies.",
  },
  "WE-LT Halogen Free Conductive Shielding Gasket": {
    name: "WE-LT Halogen Free Conductive Shielding Gasket",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Halogen-free knitted wire mesh gasket for EMI shielding in environmentally restricted applications.",
    hint: "Specify for medical, automotive, or consumer products where halogen-free materials are mandated — same shielding performance as standard WE-LT but compliant with RoHS and REACH halogen restrictions.",
  },
  "WE-SECF SMT EMI Contact Finger": {
    name: "WE-SECF SMT EMI Contact Finger",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "SMT-solderable spring contact finger for connecting PCB shielding cans to ground planes.",
    hint: "Solder to the PCB ground plane around the perimeter of a shielding can footprint — the spring fingers make reliable contact with the can walls when pressed down, grounding the shield.",
  },
  "WE-SHC Seamless Shielding Cabinet": {
    name: "WE-SHC Seamless Shielding Cabinet",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "One-piece seamless metal shielding can for board-level RF isolation of sensitive circuits.",
    hint: "Solder onto PCB to completely enclose an RF module, oscillator, or sensitive analog circuit — seamless construction provides superior shielding effectiveness compared to two-piece designs.",
  },
  "WE-SHC Shielding Cabinet": {
    name: "WE-SHC Shielding Cabinet",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Two-piece PCB-mounted shielding cabinet with removable lid for board-level EMI isolation.",
    hint: "Mount the frame to the PCB by soldering, then press the lid into place — removable lid allows access to shielded components during testing and rework.",
  },
  "WE-SMGS Surface Mount Solderable Gasket": {
    name: "WE-SMGS Surface Mount Solderable Gasket",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "SMT-solderable conductive gasket for creating EMI-tight joints between PCB-mounted shields and lids.",
    hint: "Solder to the PCB shield frame to create a continuous low-impedance seal when the shield lid is attached — eliminates EMI leakage through the frame-to-lid interface.",
  },
  "WE-ST Conductive NiCu Glass Fibre Woven": {
    name: "WE-ST Conductive NiCu Glass Fibre Woven",
    category: "EMC Components",
    subcategory: "EMC Shielding",
    shortDescription: "Nickel-copper coated woven glass fibre fabric for flexible EMI shielding and grounding straps.",
    hint: "Use as a flexible shielding wrap for cables, or cut into strips as grounding straps — NiCu coating provides excellent conductivity while woven glass fibre substrate gives mechanical flexibility.",
  },

  // --- WE-ExB ---
  "WE-ExB Common Mode Power line choke": {
    name: "WE-ExB Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Extended bandwidth common mode choke for broadband mains power line EMI suppression.",
    hint: "Use when a single choke must cover a broad noise spectrum — ExB construction maintains high impedance from 150 kHz through several MHz to address both conducted emission limits.",
  },

  // --- WE-FCLP ---
  "We-FCLP Common Mode Power Line Choke": {
    name: "WE-FCLP Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Flat core low-profile common mode choke for slim power supply filter stages.",
    hint: "Ideal for laptop adapters and USB-C PD chargers requiring full mains filtering in a height-restricted assembly — flat core keeps profile under 15mm.",
  },

  // --- WE-FI ---
  "WE-FI Leaded torodial Line Choke": {
    name: "WE-FI Leaded Toroidal Line Choke",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "Toroidal leaded choke for simultaneous common-mode and differential-mode mains line filtering.",
    hint: "Install on mains power entry lines — the toroidal geometry provides both common-mode and differential-mode attenuation in one component, simplifying mains EMC filter design.",
  },

  // --- WE-FLAT ---
  "WE-FLAT": {
    name: "WE-FLAT Flat Ferrite Core",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "Flat ferrite core tile for broadband EMI absorption mounted directly on PCB surfaces.",
    hint: "Attach over noise-generating areas on a PCB to absorb radiated EMI before it can couple to adjacent circuits or escape the enclosure — particularly effective on clock and RF traces.",
  },
  "WE-FLAT Wire High Current SMT Ferrite": {
    name: "WE-PBF Flat Wire High Current SMT Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "Flat wire construction ferrite bead for high-current power rail EMI suppression with minimal DCR.",
    hint: "Use on battery output or motor supply lines — flat wire winding handles high currents with less resistive loss than round wire beads, reducing power dissipation in the filter.",
  },

  // --- WE-LF ---
  "WE-LF Common Mode Power Line Choke": {
    name: "WE-LF Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Leaded through-hole common mode choke for mains power line EMI suppression.",
    hint: "Standard through-hole common mode choke for mains input filters — place between the mains inlet and the bridge rectifier to block common-mode conducted emissions.",
  },
  "WE-LF SMD Common Mode Power Line Choke in SMT": {
    name: "WE-LF SMT Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "SMT-mount common mode choke for fully automated assembly of mains power EMC filters.",
    hint: "Drop-in SMT replacement for leaded WE-LF — enables 100% automated PCB assembly of the mains filter stage without manual insertion of through-hole components.",
  },

  // --- WE-LPCC ---
  "We-LPCC Common Mode Power Line Choke": {
    name: "WE-LPCC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Low-profile common mode choke for space-efficient mains input EMI filtering.",
    hint: "Fits into thin consumer device power stages where a standard upright choke won't clear the enclosure lid — provides full mains EMC filtering within a 10mm height envelope.",
  },

  // --- WE-LQ ---
  "WE-LQ SMT Inductor": {
    name: "WE-LQ SMT Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "High-Q SMT inductor for resonant circuits, RF filters, and impedance matching networks.",
    hint: "Use in LC resonant tanks or bandpass filters — high Q factor means low resistive losses, giving sharper filter roll-off and better signal selectivity.",
  },

  // --- WE-MI ---
  "WE-MI SMT Multilayer Inductor": {
    name: "WE-MI SMT Multilayer Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "Multilayer SMT inductor for compact high-frequency filtering and RF impedance matching.",
    hint: "Use in RF matching networks or as a high-frequency choke on signal lines — multilayer construction gives stable inductance in a tiny 0402 or 0603 footprint.",
  },

  // --- WE-MLS ---
  "WE-MLS Multiline AMI Suppression": {
    name: "WE-MLS Multiline EMI Suppression Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "Multi-aperture ferrite for simultaneous EMI suppression across multiple parallel signal lines.",
    hint: "Thread multiple signal wires through separate apertures to suppress common-mode noise on all lines at once — one component replaces multiple individual ferrite beads.",
  },

  // --- WE-NCC ---
  "WE-NCC Nanocrystalline Cores": {
    name: "WE-NCC Nanocrystalline Cores",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Nanocrystalline toroidal cores for winding custom high-performance EMC filter chokes.",
    hint: "Wind your own common mode choke on these cores for maximum design flexibility — nanocrystalline material provides very high permeability at low frequencies, ideal for EV and solar inverter filters.",
  },

  // --- WE-PD2 ---
  "WE-PD2 SMT Power Inductor": {
    name: "WE-PD2 SMT Power Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "High-efficiency shielded SMT power inductor for DC-DC converter energy storage.",
    hint: "Central component of a synchronous buck or boost converter — select inductance value based on switching frequency and acceptable current ripple for your application.",
  },

  // --- WE-PF ---
  "WE-PF SMT EMI Suppression Power Ferrite": {
    name: "WE-PF SMT EMI Suppression Power Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "High-current SMT power ferrite for EMI suppression on DC power rails in space-constrained designs.",
    hint: "Place on the output rail of a switching power supply to absorb switching ripple — power ferrite construction tolerates high DC bias current without significant inductance rolloff.",
  },

  // --- WE-RCIS ---
  "WE-RCIS Rod Core Inductor SMT": {
    name: "WE-RCIS Rod Core Inductor SMT",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "SMT rod core inductor for compact RF choke and general purpose filtering in PCB designs.",
    hint: "Use as an RF choke on bias supply lines or as a general-purpose series filter — rod core gives higher inductance per unit volume than multilayer types at moderate frequencies.",
  },

  // --- WE-RCIT ---
  "WE-RCIT Rod Core Inductor THT": {
    name: "WE-RCIT Rod Core Inductor THT",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "Through-hole rod core inductor for broadband RF filtering and signal choke applications.",
    hint: "Thread onto circuit board as an RF choke on amplifier bias lines — through-hole mounting provides mechanical robustness for applications subject to vibration.",
  },

  // --- WE-SI ---
  "WE-SI Leaded Toroidal Storage Choke": {
    name: "WE-SI Leaded Toroidal Storage Choke",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "Toroidal leaded storage choke with high saturation current for energy storage in power converters.",
    hint: "Core inductor in a boost or flyback converter — toroidal geometry minimises stray magnetic field and provides high inductance with low core losses at switching frequencies.",
  },

  // --- WE-SL2 ---
  "WE-SL2 SMT Common Mode Line Filter": {
    name: "WE-SL2 SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "Two-line SMT common mode filter for differential pair signal integrity and conducted EMC compliance.",
    hint: "Place on RS-485, CAN, or any balanced differential pair at the board connector edge to reject externally-coupled common-mode noise while passing the differential signal unaffected.",
  },

  // --- WE-SL5 HC ---
  "WE-SL5 HC SMT Common Mode Line Filter": {
    name: "WE-SL5 HC SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "High-current 5-line SMT common mode filter for power-over-data interfaces.",
    hint: "Use on USB Power Delivery or Power over Ethernet lines — HC (High Current) variant handles the combined data and power currents without saturation of the common-mode inductance.",
  },

  // --- WE-SUKW ---
  "WE-SUKW SMT EMI Suppression 5-Hole Ferrite Bead": {
    name: "WE-SUKW SMT EMI Suppression 5-Hole Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "5-aperture SMT ferrite bead for multi-turn high-impedance EMI suppression in a compact footprint.",
    hint: "Route a signal trace through all five holes to create a multi-turn inductor effect — multiplies impedance compared to a single-aperture bead of the same footprint for aggressive EMI suppression.",
  },

  // --- WE-TFC ---
  "WE-TFC Common Mode Power Line Choke": {
    name: "WE-TFC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Toroidal ferrite core common mode choke for high-performance mains power line filtering.",
    hint: "Toroidal core geometry gives very high inductance in a compact footprint with minimal stray field — use where PCB space is limited but strong mains common-mode attenuation is required.",
  },

  // --- WE-TI ---
  "WE-TI Radial Leaded Wire Wound Inductor": {
    name: "WE-TI Radial Leaded Wire Wound Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    shortDescription: "Radial leaded wire-wound inductor for power line filtering and energy storage in through-hole designs.",
    hint: "Use in the output stage of a linear or switching power supply to smooth current ripple — radial leaded format suits both manual and automated through-hole PCB assembly.",
  },

  // --- WE-TOF ---
  "WE-TOF": {
    name: "WE-TOF Toroidal Ferrite Core",
    category: "EMC Components",
    subcategory: "Ferrites for Cable Assembly",
    shortDescription: "Toroidal ferrite core for winding custom cable chokes or multi-turn PCB inductors.",
    hint: "Wind your own choke by threading a cable or wire through the toroid multiple times — each additional turn multiplies inductance by the square of turns, enabling high inductance in a small core.",
  },

  // --- WE-TPB ---
  "We-TPB HV Three Phase common Mode Power Line Choke": {
    name: "WE-TPB HV Three-Phase Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "High-voltage three-phase common mode choke for industrial motor drive and inverter EMC filtering.",
    hint: "Mount at the mains input of a 3-phase variable frequency drive — filters common-mode currents on all three phases simultaneously to meet EN 61800-3 and IEC 61000-6-4 standards.",
  },
  "WE_TPB Three Phase common Mode Power Line Choke": {
    name: "WE-TPB Three-Phase Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Three-phase common mode power line choke for industrial motor drive EMC compliance.",
    hint: "Install on 3-phase mains inputs of industrial drives and inverters to suppress common-mode conducted emissions across all three line conductors in a single component.",
  },

  // --- WE-TVS ---
  "WE-TVS TVS Diode - High Speed Series": {
    name: "WE-TVS TVS Diode — High Speed Series",
    category: "EMC Components",
    subcategory: "ESD Protection",
    shortDescription: "Low-capacitance TVS diode for ESD protection of high-speed data interfaces up to several Gbps.",
    hint: "Place at connector pins on USB, HDMI, or Ethernet interfaces — low junction capacitance (typically <0.5 pF) preserves signal integrity at multi-gigabit data rates.",
  },
  "WE-TVS TVS Diode - Super Speed Series": {
    name: "WE-TVS TVS Diode — Super Speed Series",
    category: "EMC Components",
    subcategory: "ESD Protection",
    shortDescription: "Ultra-low capacitance TVS diode for ESD protection of 10+ Gbps multi-gigabit data lines.",
    hint: "Use on PCIe Gen 4, USB 3.2, or Thunderbolt 4 lines — sub-100 fF capacitance ensures no eye diagram degradation or jitter penalty at 10+ Gbps data rates.",
  },
  "WE-TVSP Power TVS Diode": {
    name: "WE-TVSP Power TVS Diode",
    category: "EMC Components",
    subcategory: "Surge Protection",
    shortDescription: "High-power TVS diode for surge and lightning transient protection on DC power supply outputs.",
    hint: "Place on the output bus of a power supply or at the DC input of field equipment — clamps lightning surges and load dump transients to protect all downstream components.",
  },

  // --- WE-UCF ---
  "WE-UCF SMT Common Mode Line Filter": {
    name: "WE-UCF SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    shortDescription: "Ultra-compact SMT common mode filter for IoT, wearable, and space-constrained PCB designs.",
    hint: "Smallest footprint common mode filter in the WE range — use on I2C, UART, or SPI lines in wearable devices where every square millimetre of PCB area counts.",
  },

  // --- WE-UKW ---
  "We-UKW EMI Supression 6-Hole Ferrite Bead": {
    name: "WE-UKW EMI Suppression 6-Hole Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "6-aperture ferrite bead for very high impedance EMI suppression through multi-turn conductor routing.",
    hint: "Route a signal wire or trace through all six holes for maximum EMI suppression in minimum board area — six turns gives 36x the inductance of a single-turn bead of equivalent core material.",
  },

  // --- WE-VD ---
  "WE-VD Disk Varistor": {
    name: "WE-VD Disk Varistor",
    category: "EMC Components",
    subcategory: "Surge Protection",
    shortDescription: "Through-hole disk metal oxide varistor for high-energy AC mains surge protection.",
    hint: "Connect across mains live and neutral at the power entry point — absorbs lightning strike energy and mains switching surges to protect all downstream circuitry from overvoltage damage.",
  },

  // --- WE-VE ---
  "WE-VE ESD Suppressor": {
    name: "WE-VE ESD Suppressor",
    category: "EMC Components",
    subcategory: "ESD Protection",
    shortDescription: "General purpose ESD suppressor for IEC 61000-4-2 level 4 protection of I/O and communication ports.",
    hint: "Add to every external connector pin — clamps human-body model ESD events (up to 8 kV contact discharge) to protect sensitive CMOS input stages from electrostatic damage.",
  },
  "WE-VE femtoF": {
    name: "WE-VE femtoF ESD Suppressor",
    category: "EMC Components",
    subcategory: "ESD Protection",
    shortDescription: "Femtofarad-capacitance ESD suppressor for RF and mmWave antenna port protection.",
    hint: "Use on 5G mmWave or UWB antenna ports — femtofarad capacitance is negligible at GHz frequencies, providing full ESD protection without any detuning of the antenna element.",
  },
  "WE-VE ULC ESD Suppressor": {
    name: "WE-VE ULC ESD Suppressor",
    category: "EMC Components",
    subcategory: "ESD Protection",
    shortDescription: "Ultra-low capacitance ESD suppressor for protecting RF and microwave signal paths.",
    hint: "Place on antenna feed lines, RF input pins, or LNA inputs — ULC (Ultra Low Capacitance) prevents the protection device from loading and detuning RF circuits above 1 GHz.",
  },

  // --- WE-VS ---
  "WE-VS SMT Varistor": {
    name: "WE-VS SMT Varistor",
    category: "EMC Components",
    subcategory: "Surge Protection",
    shortDescription: "SMT metal oxide varistor for automated-assembly surge protection on mains and signal lines.",
    hint: "Solder across power input rails or signal lines for overvoltage clamp protection — SMT format integrates surge protection into fully automated PCB assembly without manual insertion.",
  },

  // --- WE-FC ---
  "WE_FC Common Mode POwer Line Choke": {
    name: "WE-FC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    shortDescription: "Flat-pack common mode choke for low-profile mains power line EMI filtering.",
    hint: "Use in slim power adapters or flat-panel display power supplies where vertical height is tightly constrained — flat-pack construction keeps profile below standard upright chokes.",
  },

  // --- WE-STAR (already covered Ferrite WE-WAFB) ---
  "Ferrite WE-WAFB Sleeve Choke": {
    name: "WE-WAFB Sleeve Choke",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    shortDescription: "Ferrite sleeve choke for threading over cables to suppress common-mode conducted emissions.",
    hint: "Thread a power or signal cable through the sleeve before termination — the ferrite sleeve adds common-mode impedance to the cable without any PCB modification.",
  },

};
