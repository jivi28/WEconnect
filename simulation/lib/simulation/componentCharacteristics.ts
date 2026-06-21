/**
 * Real technical characteristics for each component, sourced directly from
 * the Würth Elektronik product pages and datasheets.
 *
 * Used ONLY in free build mode to show the actual product specifications.
 * The puzzle/simulation mode uses the `hint` field in componentOverrides.ts instead.
 *
 * Keys must match the exact folder names in the WEComponents/ directory.
 */
export const COMPONENT_CHARACTERISTICS: Record<string, string[]> = {

  // --- SNAP FERRITES ---

  "STP_WE-STAR-GAP": [
    "Core material: NiZn",
    "Frequency range: 1 MHz to 1 GHz — high-frequency and saturation specialist",
    "World's first folding ferrite with defined 0.8 mm air gap",
    "Low magnetic saturation at high DC currents — impedance stays high under load",
    "Extremely low useful signal attenuation up to 100 MHz",
    "Patented flexible cable fixation from Würth Elektronik's own development",
    "Cable pre-fixing facilitates assembly and processing",
    "Cable pinch protection built in",
    "Internal closure with WE-STAR-KEY technology prevents unauthorised cable removal",
    "Each sample delivery includes a key",
    "Plastic housing classification: UL94 V0",
    "Operating temperature: −25 °C to +105 °C",
  ],

  "STP_WE-STAR-BUENO": [
    "Core material: NiZn",
    "Frequency range: 1 MHz to 1 GHz — compact all-rounder",
    "Compact design for space-constrained cable installations",
    "Snap-on assembly without tools — no cable cutting required",
    "Suitable for cable diameters up to 13 mm",
    "WE-STAR-KEY security locking system prevents unauthorised removal",
    "Cable pre-fixing system facilitates processing",
    "Plastic housing classification: UL94 V0",
    "Operating temperature: −25 °C to +105 °C",
  ],

  "STP_WE-STAR-FLAT": [
    "Core material: NiZn",
    "Frequency range: 1 MHz to 1 GHz — ribbon cable suppressor",
    "Specifically designed for flat ribbon cables and FFC connectors",
    "Flat geometry covers full width of ribbon cable for uniform EMI suppression",
    "Snap-on assembly without cable interruption",
    "WE-STAR-KEY security locking system",
    "Cable pre-fixing facilitates processing",
    "Plastic housing classification: UL94 V0",
    "Operating temperature: −25 °C to +105 °C",
  ],

  "STP_WE-STAR-Ring": [
    "Core material: NiZn",
    "Frequency range: 1 MHz to 1 GHz — screwable fixation",
    "Screw-on ring design provides 360° EMI suppression coverage",
    "Secure mechanical fixation via screw thread — vibration resistant",
    "Suitable for harsh industrial environments with vibration",
    "Multiple turns possible by looping cable through the ring",
    "Operating temperature: −25 °C to +105 °C",
  ],

  "STP_WE-START-TEC": [
    "Core material: NiZn",
    "Frequency range: 1 MHz to 1 GHz — multi-purpose ferrite",
    "Patented snap ferrite with WE-STAR-KEY security key technology",
    "Cable pre-fixing system prevents assembly errors",
    "Cable clamping protection prevents damage during fitting",
    "Can be opened and refitted at any time using the included key",
    "Suitable for cable diameters from 4.5 mm to 12.5 mm",
    "Plastic housing classification: UL94 V0",
    "Operating temperature: −25 °C to +105 °C",
  ],

  "STP_WEStarTecLFS": [
    "Core material: MnZn — low frequency specialist",
    "Frequency range: 300 kHz to 30 MHz",
    "Optimised for sub-30 MHz noise suppression where NiZn types are ineffective",
    "Patented WE-STAR-KEY security locking prevents unauthorised removal",
    "Cable pre-fixing system facilitates assembly",
    "Suitable for cable diameters from 4.5 mm to 12.5 mm",
    "Plastic housing classification: UL94 V0",
    "Operating temperature: −25 °C to +105 °C",
  ],

  // --- SHIELDING MECHANICAL ---

  "Shielding Cabinet Clip": [
    "Mechanical retention clip for WE-SHC shielding cabinet lids",
    "Ensures continuous low-impedance contact between lid and frame",
    "Prevents lid from lifting under mechanical shock or vibration",
    "Compatible with WE-SHC standard and seamless shielding cabinet series",
    "Solderable to PCB alongside shield frame",
    "RoHS compliant",
  ],

  "earthing belt": [
    "Flexible conductive bonding strap for PCB-to-chassis grounding",
    "Low DC resistance for effective ground bonding",
    "Flexible construction accommodates relative movement between PCB and chassis",
    "Available in multiple lengths and widths",
    "Suitable for grounding PCB ground planes, heat sinks, and enclosure panels",
    "RoHS compliant",
  ],

  "WE-RIB": [
    "Flexible conductive ribbon for EMI bonding connections",
    "Low impedance at high frequencies for effective RF grounding",
    "Flexible substrate withstands repeated flexing without fatigue failure",
    "Suitable for grounding moving assemblies, hinged panels, and PCB interconnects",
    "Available in various widths and lengths",
    "RoHS compliant",
  ],

  "Ferrite WE-WAFB Sleeve Choke": [
    "Core material: NiZn or MnZn (depending on variant)",
    "Through-hole cable sleeve format — no PCB mounting required",
    "Thread cable through sleeve aperture before termination",
    "Suppresses common-mode currents on power and signal cables",
    "Frequency range: 1 MHz to 500 MHz (NiZn) or 100 kHz to 10 MHz (MnZn)",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- INTERFERENCE SUPPRESSION CAPACITORS ---

  "WCAP-CSSA Interference Suppression": [
    "Safety class: X1/Y2 or X2/Y2 rated (class depending on variant)",
    "Multilayer ceramic construction (MLCC) — compact SMT format",
    "Capacitance range: 1 nF to 100 nF",
    "Rated voltage: 250 VAC to 305 VAC",
    "Passes IEC 60384-14 safety certification for mains-connected applications",
    "Self-healing dielectric — safe failure mode (open circuit)",
    "Operating temperature: −40 °C to +125 °C",
    "Automotive grade variants available (AEC-Q200)",
    "RoHS and REACH compliant",
  ],

  "WCAP-FTX2 Film Capacitors": [
    "Safety class: X2 (across-the-line, 275 VAC rated)",
    "Dielectric: Metallised polypropylene (MKP)",
    "Capacitance range: 1 nF to 10 µF",
    "Self-healing metallised film — safe open-circuit failure mode",
    "Low ESR and high ripple current capability",
    "Suitable for EMI suppression filters on AC mains inputs",
    "Flame retardant encapsulation: UL94 V0",
    "Operating temperature: −40 °C to +110 °C",
    "Certifications: UL, ENEC, CQC",
  ],

  "WCAP-FTXH Film Capacitors": [
    "Safety class: X1/X2 high-capacitance variant",
    "Dielectric: Metallised polypropylene (MKP)",
    "Higher capacitance values than standard FTX2 for stronger differential filtering",
    "Self-healing metallised film construction",
    "Suitable for aggressive mains EMI suppression filter stages",
    "Flame retardant encapsulation: UL94 V0",
    "Operating temperature: −40 °C to +110 °C",
    "Certifications: UL, ENEC",
  ],

  "WCAP-FTXX Film Capacitors": [
    "Safety class: X2 rated for across-the-line mains suppression",
    "Dielectric: Metallised polypropylene (MKP)",
    "General purpose mains EMI suppression capacitor",
    "Capacitance range: 1 nF to 4.7 µF",
    "Low self-inductance for effective high-frequency filtering",
    "Flame retardant encapsulation: UL94 V0",
    "Operating temperature: −40 °C to +110 °C",
    "Certifications: UL, ENEC, CQC, KC",
  ],

  "WCAP-FTY2 Film Capacitors": [
    "Safety class: Y2 rated (line-to-earth, 250 VAC)",
    "Dielectric: Metallised polypropylene (MKP)",
    "Safe open-circuit failure mode — essential for Y-cap applications",
    "Capacitance range: 1 nF to 10 nF",
    "Used between live/neutral and protective earth in mains filters",
    "IEC 60384-14 Class Y2 certified",
    "Flame retardant encapsulation: UL94 V0",
    "Operating temperature: −40 °C to +110 °C",
    "Certifications: UL, ENEC, CQC, VDE",
  ],

  // --- WE-AFB ---

  "WE-AFB": [
    "Axial through-hole ferrite bead for lead-through EMI suppression",
    "Core material: NiZn",
    "Frequency range: 1 MHz to 500 MHz",
    "Suitable for power supply leads and signal wires",
    "Available in various inner bore diameters: 0.6 mm to 4.2 mm",
    "Can be threaded onto component leads before soldering",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-AFB LFS": [
    "Axial through-hole ferrite bead — low frequency specialist",
    "Core material: MnZn",
    "Frequency range: 100 kHz to 30 MHz",
    "Higher impedance at lower frequencies than standard NiZn AFB",
    "Suitable for suppressing switching converter noise below 10 MHz",
    "Available in various inner bore diameters",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- CCMF ---

  "WE-CCMF Ceramic Common Mode Filter": [
    "Integrated ceramic common mode filter with built-in ESD protection",
    "Common mode impedance: >90 Ω at 100 MHz",
    "Differential mode insertion loss: <1 dB up to 500 MHz",
    "ESD protection level: IEC 61000-4-2 Level 4 (8 kV contact)",
    "Ultra-compact SMT package: 0805 or 1206 footprint",
    "Designed for USB 2.0, HDMI, and mobile interface lines",
    "Operating temperature: −40 °C to +85 °C",
    "RoHS compliant",
  ],

  "WE-CCMF Common Mode Filter": [
    "Ceramic common mode filter for differential signal line EMC compliance",
    "Common mode impedance: >60 Ω at 100 MHz",
    "Low differential mode insertion loss preserves signal integrity",
    "Single-component EMC filter solution for data interfaces",
    "SMT package for automated assembly",
    "Operating temperature: −40 °C to +85 °C",
    "RoHS compliant",
  ],

  // --- WE-CLFS ---

  "WE-CLFS Line Filter": [
    "Integrated single or two-stage complete line filter module",
    "Combines common mode choke + X/Y capacitors in one certified housing",
    "Rated current: 1 A to 20 A (depending on variant)",
    "Rated voltage: 250 VAC",
    "Attenuation: >40 dB at 150 kHz in common mode",
    "Variants: single-stage, single-stage advanced, two-stage, low leakage",
    "IEC 60939 and UL 1283 certified",
    "Operating temperature: −25 °C to +100 °C",
    "Screw terminal and PCB pin connection options",
  ],

  // --- WE-CMB VARIANTS ---

  "WE-CMB HV Common Mode Power Line Choke": [
    "Rated for 400 VAC and above — industrial mains voltage rated",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 100 mH",
    "Rated current: 1 A to 25 A",
    "Leaded through-hole package for PCB mounting",
    "Designed for 3-phase industrial equipment and motor drives",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  "We-CMB NiZn Common Mode Power Line Choke": [
    "Core material: NiZn — optimised for high-frequency mains suppression",
    "Effective frequency range extended above 10 MHz vs standard MnZn types",
    "Common mode inductance: 0.5 mH to 10 mH",
    "Rated current: 1 A to 16 A",
    "Rated voltage: 250 VAC",
    "Leaded through-hole package",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  "WE-CMBH Commmon Mode Power Line Choke(Verticale)": [
    "Vertical mounting orientation reduces PCB footprint area",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 47 mH",
    "Rated current: 1 A to 16 A",
    "Rated voltage: 250 VAC",
    "Low leakage inductance between windings",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  "WE-CMBNC Common Mode Power Line Choke Nanocrystalline": [
    "Core material: Nanocrystalline — highest permeability for low-frequency filtering",
    "Superior attenuation at 150 kHz–500 kHz vs ferrite core types",
    "Common mode inductance: 2 mH to 100 mH",
    "Rated current: 1 A to 50 A",
    "Rated voltage: 250 VAC to 520 VAC",
    "Compact size due to extremely high core permeability",
    "Ideal for EV charging, solar inverters, and industrial drives",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-CNSW ---

  "WE-CNSW HF SMT Common Mode Line Filter": [
    "High-frequency optimised common mode impedance — effective above 1 GHz",
    "Common mode impedance: >300 Ω at 1 GHz",
    "Differential mode insertion loss: <1 dB up to 3 GHz",
    "Suitable for USB 3.0, PCIe, HDMI 2.0 interfaces",
    "Compact SMT package: 0805",
    "Balanced winding for matched differential pair impedance",
    "Operating temperature: −40 °C to +125 °C",
    "AEC-Q200 automotive grade available",
    "RoHS compliant",
  ],

  "WE-CNSW SMT Common Mode Line Filter Extended": [
    "Extended frequency range covering both low and high frequency common-mode noise",
    "Common mode impedance: >100 Ω from 10 MHz to 1 GHz",
    "Differential mode insertion loss: <1 dB up to 500 MHz",
    "Suitable for USB 2.0, CAN, RS-485, and general data lines",
    "Compact SMT package for automated assembly",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- EMC SHIELDING ---

  "WE-CPU EMI Suppression CPU Ferrite Plate": [
    "Flat ferrite tile for near-field EMI absorption over processor ICs",
    "Frequency range: 100 MHz to 3 GHz",
    "Absorbs radiated near-field EMI from high-speed digital ICs",
    "Flexible adhesive backing for direct attachment to component surface",
    "Available in multiple thicknesses: 0.1 mm to 1.0 mm",
    "RoHS compliant",
    "Operating temperature: −40 °C to +120 °C",
  ],

  "WE-CSGS Contact Spring Gasket": [
    "Material: Beryllium copper with gold or tin plating",
    "Provides low-impedance continuous EMI shielding contact along seam joints",
    "Spring force maintains contact pressure over lifetime",
    "Suitable for PCB shield frames and enclosure lid-to-body joints",
    "SMT solderable or clip-on variants available",
    "Shielding effectiveness: >80 dB at 1 GHz",
    "Operating temperature: −55 °C to +150 °C",
    "RoHS compliant",
  ],

  "WE-EGS Conductive Elastomer Gasket": [
    "Material: Silicone elastomer filled with conductive particles (silver/nickel)",
    "Combines EMI shielding with IP-rated environmental sealing in one gasket",
    "Volume resistivity: <0.1 Ω·cm",
    "Compression set: <25% after 22 hours at 70°C",
    "Shielding effectiveness: >80 dB from 100 MHz to 10 GHz",
    "Available in various cross-section profiles and standard lengths",
    "Operating temperature: −55 °C to +150 °C",
    "RoHS compliant",
  ],

  "WE-EMIP EMI Patch": [
    "Self-adhesive electromagnetic absorber patch",
    "Frequency range: 100 MHz to 6 GHz",
    "Reduces near-field radiated emissions from PCB hotspots",
    "Thin flexible construction: 0.5 mm to 2.0 mm thickness",
    "Applied directly onto radiating component surfaces after assembly",
    "No PCB redesign required — retrofit EMC fix",
    "Operating temperature: −40 °C to +100 °C",
    "RoHS compliant",
  ],

  "WE-FAS Flexible Absorber Sheet": [
    "Flexible broadband microwave absorber sheet",
    "Frequency range: 100 MHz to 40 GHz",
    "Absorbs microwave energy — reduces reflections inside enclosures",
    "Thin and flexible: can be cut to any shape and conformed to curved surfaces",
    "Self-adhesive backing for easy application",
    "Particularly effective for wireless products (Wi-Fi, Bluetooth, 5G)",
    "Operating temperature: −40 °C to +100 °C",
    "RoHS compliant",
  ],

  "WE-FSFS Flexible Sintered Ferrite Sheet": [
    "Flexible sintered ferrite sheet for near-field magnetic shielding",
    "Frequency range: 100 kHz to 15 MHz — optimised for NFC/RFID",
    "Channels magnetic flux from NFC antenna, preventing metal detuning",
    "Thin flexible construction: 0.1 mm to 1.0 mm",
    "Improves NFC antenna read range when mounted near metallic surfaces",
    "Available in cut-to-size sheets and custom die-cut shapes",
    "Operating temperature: −40 °C to +85 °C",
    "RoHS compliant",
  ],

  "WE-LS Conductive Foam": [
    "Material: Conductive polyurethane foam with metallic coating",
    "Volume resistivity: <1 Ω·cm",
    "Compliant construction fills irregular gaps in mating surfaces",
    "Compression range: 20% to 60% for effective contact pressure",
    "Shielding effectiveness: >60 dB at 1 GHz",
    "Available in sheet form — can be cut to any shape",
    "Operating temperature: −40 °C to +80 °C",
    "RoHS compliant",
  ],

  "WE-LT Conductive Shielding Gasket": [
    "Material: Tin-plated or monel-coated knitted wire mesh",
    "Very low DC resistance for excellent grounding contact",
    "High shielding effectiveness: >100 dB at 1 GHz",
    "Suitable for machined enclosure grooves and panel flanges",
    "Available in round wire, flat strip, and tubular cross-section profiles",
    "Designed for MIL-STD-461 and DO-160 compliant equipment",
    "Operating temperature: −65 °C to +200 °C",
    "RoHS compliant",
  ],

  "WE-LT Halogen Free Conductive Shielding Gasket": [
    "Material: Halogen-free conductive knitted wire mesh",
    "Meets RoHS and REACH halogen content restrictions",
    "Same shielding effectiveness as standard WE-LT: >100 dB at 1 GHz",
    "Required for medical, automotive, and consumer products with halogen restrictions",
    "Available in round wire and flat strip profiles",
    "Operating temperature: −65 °C to +200 °C",
    "RoHS and REACH halogen-free compliant",
  ],

  "WE-SECF SMT EMI Contact Finger": [
    "Material: Phosphor bronze with tin or gold plating",
    "SMT-solderable spring contact finger for shielding can grounding",
    "Contact force: 0.1 N to 0.5 N per finger (depending on variant)",
    "Low-profile design fits under standard shield can walls",
    "Reflow solderable — compatible with automated PCB assembly",
    "Shielding effectiveness: >80 dB at 1 GHz when used with WE-SHC",
    "Operating temperature: −55 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-SHC Seamless Shielding Cabinet": [
    "One-piece seamless drawn metal construction — no seams for EMI leakage",
    "Material: Tinplate steel",
    "Superior shielding effectiveness vs two-piece designs",
    "PCB-mountable: solders directly to PCB ground plane",
    "Compatible with WE-SECF SMT contact fingers",
    "Available in a wide range of standard footprint sizes",
    "Shielding effectiveness: >80 dB from 100 MHz to 6 GHz",
    "Operating temperature: −55 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-SHC Shielding Cabinet": [
    "Two-piece PCB-mounted shielding cabinet: frame + removable lid",
    "Material: Tinplate steel",
    "Removable lid allows access to shielded components during testing and rework",
    "Frame solders to PCB ground plane for low-impedance RF connection",
    "Compatible with WE-SECF contact fingers for enhanced sealing",
    "Wide range of standard footprint sizes available",
    "Shielding effectiveness: >70 dB from 100 MHz to 6 GHz",
    "Operating temperature: −55 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-SMGS Surface Mount Solderable Gasket": [
    "Material: Tin-plated copper knitted mesh in solderable frame",
    "Creates hermetic EMI seal at shield cabinet lid-to-frame interface",
    "Reflow solderable for automated assembly integration",
    "Eliminates EMI leakage through the lid/frame joint",
    "Compatible with WE-SHC shielding cabinet series",
    "Operating temperature: −55 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-ST Conductive NiCu Glass Fibre Woven": [
    "Material: Woven glass fibre coated with nickel-copper (NiCu)",
    "Surface resistivity: <0.1 Ω/sq",
    "Flexible and conformable — suitable for cable wrapping and gasket strips",
    "Frequency range: effective EMI shielding from DC to above 10 GHz",
    "Available in sheet and roll form, can be cut or die-cut to shape",
    "Suitable for cable braiding, gaskets, and flexible grounding straps",
    "Operating temperature: −55 °C to +150 °C",
    "RoHS compliant",
  ],

  // --- WE-ExB ---

  "WE-ExB Common Mode Power line choke": [
    "Core material: MnZn ferrite — extended bandwidth design",
    "Effective attenuation from 150 kHz to above 30 MHz",
    "Common mode inductance: 1 mH to 68 mH",
    "Rated current: 1 A to 20 A",
    "Rated voltage: 250 VAC",
    "Leaded through-hole package for PCB mounting",
    "Covers both CISPR 22 Class A and Class B frequency ranges in one component",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-FCLP ---

  "We-FCLP Common Mode Power Line Choke": [
    "Flat core construction — low profile below 15 mm height",
    "Core material: MnZn ferrite",
    "Common mode inductance: 2 mH to 47 mH",
    "Rated current: 1 A to 16 A",
    "Rated voltage: 250 VAC",
    "Leaded through-hole package",
    "Designed for slim power adapters and USB-C PD chargers",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-FI ---

  "WE-FI Leaded torodial Line Choke": [
    "Toroidal core construction — high inductance in compact footprint",
    "Core material: MnZn ferrite",
    "Provides simultaneous common-mode and differential-mode attenuation",
    "Common mode inductance: 0.5 mH to 100 mH",
    "Rated current: 0.5 A to 20 A",
    "Leaded through-hole radial package",
    "Low stray magnetic field due to toroidal geometry",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-FLAT ---

  "WE-FLAT": [
    "Flat ferrite tile for broadband near-field EMI absorption",
    "Core material: NiZn or MnZn (depending on variant)",
    "Frequency range: 1 MHz to 1 GHz",
    "Mounts directly on PCB surface over radiating traces or components",
    "Available in multiple standard sizes and thicknesses",
    "Self-adhesive backing available for easy application",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-FLAT Wire High Current SMT Ferrite": [
    "Flat wire winding construction for minimal DCR at high currents",
    "Rated current: up to 50 A (depending on variant)",
    "DCR: significantly lower than round wire beads of equivalent inductance",
    "SMT mounting for automated PCB assembly",
    "Suitable for battery, motor supply, and high-current DC bus lines",
    "Low profile construction",
    "Operating temperature: −40 °C to +125 °C",
    "AEC-Q200 automotive grade available",
    "RoHS compliant",
  ],

  // --- WE-LF ---

  "WE-LF Common Mode Power Line Choke": [
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 82 mH",
    "Rated current: 1 A to 25 A",
    "Rated voltage: 250 VAC",
    "Leaded through-hole package — vertical or horizontal mount variants",
    "Low leakage inductance between windings",
    "Attenuation: >40 dB common mode at 150 kHz",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  "WE-LF SMD Common Mode Power Line Choke in SMT": [
    "SMT package — compatible with reflow soldering and automated assembly",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 47 mH",
    "Rated current: 1 A to 16 A",
    "Rated voltage: 250 VAC",
    "No manual insertion required — reduces assembly cost vs leaded WE-LF",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-LPCC ---

  "We-LPCC Common Mode Power Line Choke": [
    "Low-profile construction — maximum height below 10 mm",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 33 mH",
    "Rated current: 1 A to 10 A",
    "Rated voltage: 250 VAC",
    "Leaded through-hole package",
    "Designed for thin consumer electronics power stages",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-LQ ---

  "WE-LQ SMT Inductor": [
    "High Q factor (Q > 20 at operating frequency) for resonant circuit applications",
    "Core material: NiZn or air core (depending on variant)",
    "Inductance range: 1 nH to 10 µH",
    "Self-resonant frequency (SRF): up to 10 GHz",
    "Suitable for RF matching networks, LC filters, and impedance matching",
    "Small SMT package: 0402, 0603, 0805 footprints",
    "Operating temperature: −40 °C to +125 °C",
    "AEC-Q200 automotive grade available",
    "RoHS compliant",
  ],

  // --- WE-MI ---

  "WE-MI SMT Multilayer Inductor": [
    "Multilayer monolithic construction — no separate winding",
    "Inductance range: 1 nH to 100 µH",
    "Q factor: >10 at operating frequency",
    "Very small SMT footprint: 0201, 0402, 0603 packages",
    "Suitable for decoupling, RF filtering, and impedance matching",
    "High SRF (self-resonant frequency) for HF filtering applications",
    "Operating temperature: −40 °C to +125 °C",
    "AEC-Q200 automotive grade available",
    "RoHS compliant",
  ],

  // --- WE-MLS ---

  "WE-MLS Multiline AMI Suppression": [
    "Multiple apertures for simultaneous multi-line EMI suppression",
    "Core material: NiZn or MnZn (depending on variant)",
    "Frequency range: 1 MHz to 500 MHz",
    "One component suppresses EMI on multiple signal lines simultaneously",
    "Reduces component count vs individual single-hole beads",
    "Through-hole format — suitable for cable harness and PCB applications",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-NCC ---

  "WE-NCC Nanocrystalline Cores": [
    "Core material: Nanocrystalline alloy — highest magnetic permeability available",
    "Initial permeability: up to 100,000 (vs ~10,000 for standard ferrite)",
    "Very high inductance per turn for compact, high-performance filter chokes",
    "Saturation flux density: 1.2 T — handles high DC bias without saturation",
    "Low core losses at low frequencies (150 kHz–500 kHz)",
    "Available in standard toroidal core sizes for custom winding",
    "Operating temperature: −55 °C to +130 °C",
    "Ideal for EV chargers, solar inverters, and industrial UPS filters",
    "RoHS compliant",
  ],

  // --- WE-PD2 ---

  "WE-PD2 SMT Power Inductor": [
    "Shielded construction — low EMI radiation from inductor itself",
    "Inductance range: 0.47 µH to 470 µH",
    "Rated current: 0.1 A to 20 A (depending on variant)",
    "DCR: typically <100 mΩ for low power loss",
    "High saturation current — inductance stable under DC bias",
    "SMT package for automated reflow assembly",
    "Operating temperature: −40 °C to +125 °C",
    "AEC-Q200 automotive grade available",
    "RoHS compliant",
  ],

  // --- WE-PF ---

  "WE-PF SMT EMI Suppression Power Ferrite": [
    "Designed for DC power rail EMI suppression with high DC current tolerance",
    "Rated current: up to 20 A (depending on variant)",
    "Core material: power-grade ferrite with low saturation vs current",
    "Frequency range: 1 MHz to 300 MHz",
    "Low DCR for minimal power dissipation on power rails",
    "SMT package for automated assembly",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-RCIS / RCIT ---

  "WE-RCIS Rod Core Inductor SMT": [
    "Rod core construction — high inductance in compact SMT package",
    "Core material: NiZn ferrite rod",
    "Inductance range: 1 µH to 1 mH",
    "Q factor: >10 for efficient RF choke performance",
    "Suitable for RF bias chokes, decoupling, and broadband filtering",
    "SMT package — reflow solderable",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  "WE-RCIT Rod Core Inductor THT": [
    "Rod core construction — through-hole format for robust PCB mounting",
    "Core material: NiZn ferrite rod",
    "Inductance range: 1 µH to 10 mH",
    "Q factor: >10 for efficient RF choke performance",
    "Radial leaded for through-hole PCB assembly",
    "Mechanical robustness for vibration-sensitive applications",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-SI ---

  "WE-SI Leaded Toroidal Storage Choke": [
    "Toroidal core for minimal stray magnetic field",
    "Core material: Powder iron or ferrite (high saturation)",
    "High saturation current — maintains inductance under high DC bias",
    "Inductance range: 10 µH to 10 mH",
    "Rated current: 1 A to 20 A",
    "Leaded radial through-hole package",
    "Low core losses at switching frequencies (50 kHz–500 kHz)",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-SL2 / WE-SL5-HC ---

  "WE-SL2 SMT Common Mode Line Filter": [
    "Two-line balanced common mode filter for differential pairs",
    "Common mode impedance: >200 Ω at 100 MHz",
    "Differential mode insertion loss: <1 dB up to 100 MHz",
    "Designed for RS-485, CAN, and balanced audio interfaces",
    "Compact SMT package",
    "High winding balance for maximum common mode rejection",
    "Operating temperature: −40 °C to +125 °C",
    "AEC-Q200 automotive grade available",
    "RoHS compliant",
  ],

  "WE-SL5 HC SMT Common Mode Line Filter": [
    "High current (HC) rated 5-line common mode filter",
    "Handles combined power + data currents on USB PD and PoE lines",
    "Common mode impedance: >100 Ω at 100 MHz",
    "Rated current: up to 3 A per winding",
    "5 balanced windings for multi-lane interface filtering",
    "SMT package for automated assembly",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-SUKW ---

  "WE-SUKW SMT EMI Suppression 5-Hole Ferrite Bead": [
    "5 apertures enable multi-turn inductor effect in single SMT component",
    "Core material: NiZn ferrite",
    "Frequency range: 10 MHz to 1 GHz",
    "Effective impedance multiplied by N² (N = number of turns through apertures)",
    "Much higher impedance per footprint area than single-hole beads",
    "SMT package for automated assembly",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-TFC ---

  "WE-TFC Common Mode Power Line Choke": [
    "Toroidal ferrite core — compact and efficient",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 100 mH",
    "Rated current: 1 A to 20 A",
    "Rated voltage: 250 VAC",
    "Toroidal geometry minimises stray field and PCB footprint",
    "Leaded through-hole package",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-TI ---

  "WE-TI Radial Leaded Wire Wound Inductor": [
    "Wire-wound construction on ferrite or powder iron core",
    "Inductance range: 1 µH to 100 mH",
    "Rated current: 0.1 A to 10 A",
    "Low DCR for power supply output filtering",
    "Radial leaded for through-hole PCB assembly",
    "Suitable for manual and automated through-hole insertion",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-TOF ---

  "WE-TOF": [
    "Toroidal ferrite core for custom cable choke winding",
    "Core material: NiZn or MnZn (select based on target frequency)",
    "Available in a wide range of core sizes and permeability grades",
    "Each additional turn increases inductance by N² — flexible design",
    "Suitable for winding cable chokes, common mode filters, and transformers",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-TPB variants ---

  "We-TPB HV Three Phase common Mode Power Line Choke": [
    "Three-phase common mode choke — all three phases in one component",
    "High voltage rated: 520 VAC and above",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 47 mH",
    "Rated current: 3 A to 50 A per phase",
    "Balanced three-phase winding construction",
    "Designed for 3-phase industrial motor drives and inverters",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  "WE_TPB Three Phase common Mode Power Line Choke": [
    "Three-phase common mode choke — filters all three phases simultaneously",
    "Rated voltage: 250 VAC three-phase",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 33 mH",
    "Rated current: 3 A to 30 A per phase",
    "Single component replaces three individual chokes",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],

  // --- WE-TVS series ---

  "WE-TVS TVS Diode - High Speed Series": [
    "Low junction capacitance: typically <0.5 pF",
    "ESD protection level: IEC 61000-4-2 Level 4 (8 kV contact / 15 kV air)",
    "Response time: <1 ps — clamps ESD transients before damage occurs",
    "Clamping voltage: low overshoot for sensitive IC protection",
    "Suitable for USB 3.0, HDMI, DisplayPort, and multi-gigabit interfaces",
    "SOT or DFN SMT package",
    "Operating temperature: −55 °C to +150 °C",
    "AEC-Q101 automotive grade available",
    "RoHS compliant",
  ],

  "WE-TVS TVS Diode - Super Speed Series": [
    "Ultra-low junction capacitance: typically <100 fF",
    "ESD protection level: IEC 61000-4-2 Level 4 (8 kV contact)",
    "Designed for 10+ Gbps data lines — PCIe Gen 4, USB 3.2, Thunderbolt 4",
    "No measurable effect on eye diagram or jitter at 10 Gbps",
    "Single or multi-channel variants for space-efficient protection",
    "Operating temperature: −55 °C to +150 °C",
    "RoHS compliant",
  ],

  "WE-TVSP Power TVS Diode": [
    "High peak pulse power: 400 W to 30 kW (depending on variant)",
    "Clamping voltage: low ratio Vc/Vbr for maximum protection margin",
    "Response time: <1 ps",
    "Protects against lightning-induced surges, load dump, and inductive kickback",
    "Unidirectional and bidirectional variants available",
    "SMA, SMB, SMC, and axial through-hole packages",
    "Operating temperature: −55 °C to +150 °C",
    "AEC-Q101 automotive grade available",
    "RoHS compliant",
  ],

  // --- WE-UCF ---

  "WE-UCF SMT Common Mode Line Filter": [
    "Ultra-compact SMT package — smallest footprint in WE common mode filter range",
    "Common mode impedance: >100 Ω at 100 MHz",
    "Differential mode insertion loss: <1 dB",
    "Designed for wearables, IoT devices, and hearing aids",
    "Balanced winding for high common mode rejection ratio",
    "Package size: 0402 or 0603",
    "Operating temperature: −40 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-UKW ---

  "We-UKW EMI Supression 6-Hole Ferrite Bead": [
    "6 apertures for maximum multi-turn EMI suppression in minimum PCB area",
    "Core material: NiZn ferrite",
    "Frequency range: 10 MHz to 1 GHz",
    "6 turns through all apertures: inductance = 36× single-turn equivalent",
    "Highest impedance per footprint area in the WE ferrite bead range",
    "Through-hole or panel-mount format",
    "Operating temperature: −25 °C to +125 °C",
    "RoHS compliant",
  ],

  // --- WE-VD ---

  "WE-VD Disk Varistor": [
    "Metal oxide varistor (MOV) — disk through-hole format",
    "Varistor voltage (V1mA): 18 V to 1800 V range of variants",
    "Peak surge current: up to 10 kA (8/20 µs waveform)",
    "Peak surge energy: up to 450 J",
    "Clamping voltage ratio (Vc/Vn): typically <3.5",
    "Response time: <25 ns",
    "UL 1449 4th Edition certified for SPD (Surge Protective Device) applications",
    "Disc diameter: 5 mm to 34 mm",
    "Operating temperature: −40 °C to +85 °C",
    "RoHS compliant",
  ],

  // --- WE-VE series ---

  "WE-VE ESD Suppressor": [
    "ESD protection level: IEC 61000-4-2 Level 4 (8 kV contact / 15 kV air)",
    "Junction capacitance: 5 pF to 50 pF (depending on variant)",
    "Low clamping voltage — minimises stress on protected IC",
    "Response time: <1 ps",
    "Single, dual, and array configurations available",
    "Suitable for GPIO, UART, SPI, and general digital I/O protection",
    "SOT-23, SOD-323, and TDFN packages",
    "Operating temperature: −55 °C to +150 °C",
    "AEC-Q101 automotive grade available",
    "RoHS compliant",
  ],

  "WE-VE femtoF": [
    "Junction capacitance: <100 fF — femtofarad range",
    "ESD protection level: IEC 61000-4-2 Level 2 (4 kV contact)",
    "Negligible loading effect on RF and mmWave circuits",
    "Designed for 5G mmWave (24–40 GHz) and UWB (6–9 GHz) antenna ports",
    "Response time: <1 ps",
    "Ultra-small package for minimum PCB area impact",
    "Operating temperature: −55 °C to +150 °C",
    "RoHS compliant",
  ],

  "WE-VE ULC ESD Suppressor": [
    "Junction capacitance: typically <0.2 pF — ultra-low capacitance",
    "ESD protection level: IEC 61000-4-2 Level 4 (8 kV contact)",
    "Suitable for RF antenna lines and microwave signal paths above 1 GHz",
    "Low clamping voltage to protect sensitive RF front-end ICs",
    "Response time: <1 ps",
    "Compact SOD-323 or TDFN SMT package",
    "Operating temperature: −55 °C to +150 °C",
    "AEC-Q101 automotive grade available",
    "RoHS compliant",
  ],

  // --- WE-VS ---

  "WE-VS SMT Varistor": [
    "Metal oxide varistor (MOV) — SMT package for automated assembly",
    "Varistor voltage: 6 V to 270 V range of variants",
    "Peak surge current: up to 500 A (8/20 µs waveform)",
    "Response time: <25 ns",
    "Replaces through-hole disk varistors in fully automated assembly lines",
    "Suitable for signal line and power rail surge protection",
    "Operating temperature: −40 °C to +85 °C",
    "RoHS compliant",
  ],

  // --- WE-FC ---

  "WE_FC Common Mode POwer Line Choke": [
    "Flat-pack construction — low profile for height-restricted assemblies",
    "Core material: MnZn ferrite",
    "Common mode inductance: 1 mH to 33 mH",
    "Rated current: 1 A to 16 A",
    "Rated voltage: 250 VAC",
    "Leaded through-hole package",
    "Designed for slim power adapters and flat-panel PSUs",
    "Operating temperature: −25 °C to +130 °C",
    "RoHS compliant",
  ],
};
