import type { WEComponent } from "@/lib/types";
import { COMPONENT_OVERRIDES } from "./componentOverrides";

/**
 * Real Würth Elektronik product metadata, keyed by a fragment of the part
 * number. A folder is matched to an entry if its name CONTAINS the key
 * (case-insensitive), longest key first so e.g. WE-CBF-HF wins over WE-CBF.
 *
 * `folders` is the live list of component folders under WEComponents/ that have
 * a usable model in public/models (run scripts/copyComponents.js to refresh
 * those files; update this list if folders are added/removed).
 */
export const WE_PRODUCT_LOOKUP: Record<
  string,
  {
    name: string;
    category: string;
    subcategory: string;
    description: string;
    hint: string;
  }
> = {
  // --- EMC: FERRITES FOR PCB ---
  "WE-TMSB": {
    name: "WE-TMSB Tiny Multilayer Suppression Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Tiny multilayer ferrite bead for broadband EMI suppression in space-constrained PCB layouts.",
    hint: "Place on power or signal lines to suppress high-frequency noise before it reaches sensitive components.",
  },
  "WE-CBF-HF": {
    name: "WE-CBF HF SMT EMI Suppression Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "High-frequency SMT ferrite bead optimised for noise suppression above 1 GHz.",
    hint: "Use on high-speed data lines (USB 3.0, PCIe) to filter GHz-range interference without affecting signal integrity.",
  },
  "WE-CBF": {
    name: "WE-CBF SMT EMI Suppression Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Standard SMT ferrite bead for broadband EMI suppression on PCB power and signal lines.",
    hint: "Insert between power supply and IC to block switching noise from propagating across the board.",
  },
  "WE-MPSB": {
    name: "WE-MPSB EMI Multilayer Power Suppression Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "High-current multilayer power ferrite bead for EMI suppression on power rails.",
    hint: "Place on high-current DC power lines to suppress EMI without significant voltage drop.",
  },
  "WE-PBF": {
    name: "WE-PBF Flat Wire High Current SMT Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Flat wire ferrite bead handling high currents with minimal DCR for power line filtering.",
    hint: "Ideal for motor drive outputs and battery lines where both high current and EMC compliance are needed.",
  },
  "WE-RFI": {
    name: "WE-RFI SMT Wirewound Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Wirewound SMT ferrite bead with high impedance for RF interference suppression.",
    hint: "Use on RF-sensitive signal lines to block radio-frequency interference without attenuating DC.",
  },
  "WE-PF": {
    name: "WE-PF SMT EMI Suppression Power Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Power ferrite for SMT mounting, optimised for suppressing switching converter noise.",
    hint: "Position after the switching stage of a power converter to clean up the output voltage waveform.",
  },
  "WE-CMS": {
    name: "WE-CMS SMT Bead Array",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Multi-line SMT ferrite bead array for simultaneous filtering of multiple signal lines.",
    hint: "Use on multi-lane interfaces like LCD data buses to filter all lines with a single compact package.",
  },
  "WE-SUKW": {
    name: "WE-SUKW SMT EMI Suppression 5-Hole Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "5-hole ferrite bead for multi-turn winding, achieving high impedance in a small footprint.",
    hint: "Thread signal wires through multiple holes to increase EMI suppression without extra PCB area.",
  },
  "WE-UKW": {
    name: "WE-UKW EMI Suppression 6-Hole Ferrite Bead",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "6-hole ferrite bead providing very high impedance through multi-turn conductor arrangement.",
    hint: "Use on cable harnesses or board interconnects to achieve maximum EMI attenuation in tight spaces.",
  },
  "WE-MLS": {
    name: "WE-MLS Multiline EMI Suppression Ferrite",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Multi-line ferrite for simultaneous EMI suppression across several parallel conductors.",
    hint: "Place on ribbon cables or multi-pin connectors to filter common-mode noise across all lines at once.",
  },
  "WE-WAFB": {
    name: "WE-WAFB Sleeve Choke",
    category: "EMC Components",
    subcategory: "Ferrites for PCB Assembly",
    description:
      "Sleeve ferrite choke for through-hole mounting, suppressing common-mode currents.",
    hint: "Thread power cables through the sleeve to suppress common-mode interference at the entry point of an enclosure.",
  },

  // --- EMC: FILTER CHOKES ---
  "WE-MI": {
    name: "WE-MI SMT Multilayer Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "Multilayer SMT inductor for high-frequency filtering and impedance matching in compact designs.",
    hint: "Use in RF matching networks or as a high-frequency filter on signal lines in wireless modules.",
  },
  "WE-SD": {
    name: "WE-SD Rod Core Choke",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "Rod core choke for differential mode filtering with high inductance in a leaded package.",
    hint: "Place on AC power inputs to attenuate differential-mode conducted emissions from switching converters.",
  },
  "WE-FI": {
    name: "WE-FI Leaded Toroidal Line Choke",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "Toroidal leaded choke for effective common-mode and differential-mode line filtering.",
    hint: "Install on mains power entry to simultaneously suppress both common-mode and differential noise.",
  },
  "WE-TI": {
    name: "WE-TI Radial Leaded Wire Wound Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "Radial leaded wire-wound inductor for power line filtering and energy storage.",
    hint: "Use in the output stage of a DC-DC converter to smooth current and reduce output voltage ripple.",
  },
  "WE-SI": {
    name: "WE-SI Leaded Toroidal Storage Choke",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "Toroidal storage choke with high saturation current for energy storage in power converters.",
    hint: "Core component of a boost or buck converter — stores energy during the switch-on phase and releases it during switch-off.",
  },
  "WE-RCIT": {
    name: "WE-RCIT Rod Core Inductor THT",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "Through-hole rod core inductor for broadband RF filtering and signal choke applications.",
    hint: "Use as an RF choke on bias lines in amplifier circuits to prevent RF from entering the DC supply.",
  },
  "WE-RCIS": {
    name: "WE-RCIS Rod Core Inductor SMT",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "SMT rod core inductor for compact RF filtering and general purpose inductance in PCB designs.",
    hint: "Drop-in SMT replacement for leaded RF chokes — use on RF signal paths to block unwanted frequencies.",
  },
  "WE-PD2": {
    name: "WE-PD2 SMT Power Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "High-efficiency SMT power inductor optimised for DC-DC converter energy storage.",
    hint: "Central component of a synchronous buck converter — select inductance to set current ripple at your switching frequency.",
  },
  "WE-LQ": {
    name: "WE-LQ SMT Inductor",
    category: "EMC Components",
    subcategory: "Filter Chokes",
    description:
      "High-Q SMT inductor for resonant circuits, RF filters, and impedance matching networks.",
    hint: "Use in LC resonant tanks or bandpass filters where low loss (high Q) is critical for selectivity.",
  },

  // --- EMC: COMMON MODE CHOKES (DATA LINES) ---
  "WE-CNSW-HF": {
    name: "WE-CNSW HF SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "High-frequency SMT common mode filter for GHz-range data line EMC compliance.",
    hint: "Place on USB 3.0, HDMI, or PCIe lanes to suppress GHz common-mode noise while passing differential signals.",
  },
  "WE-CNSW": {
    name: "WE-CNSW SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "SMT common mode filter for noise suppression on low-voltage differential signal pairs.",
    hint: "Insert on USB 2.0 or CAN bus lines to reject common-mode interference while passing the differential data signal.",
  },
  "WE-CCMF": {
    name: "WE-CCMF Ceramic Common Mode Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Ceramic-based common mode filter with integrated ESD protection for data interfaces.",
    hint: "Use on mobile device interfaces (USB-C, Lightning) to simultaneously filter EMI and protect against ESD events.",
  },
  "WE-CMDC": {
    name: "WE-CMDC Common Mode Data Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Common mode filter optimised for high-speed data lines with minimal signal distortion.",
    hint: "Place on Ethernet or high-speed serial lines to suppress common mode noise without degrading eye diagram quality.",
  },
  "WE-SLM": {
    name: "WE-SLM SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Multi-line SMT common mode filter for simultaneous filtering of multiple differential pairs.",
    hint: "Use on multi-lane interfaces (LVDS displays, camera modules) to filter all pairs with one component.",
  },
  "WE-SL1": {
    name: "WE-SL1 SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Compact single-line SMT common mode filter for USB and low-speed data interfaces.",
    hint: "Ideal for USB 1.1/2.0 lines to meet EN 55032 emissions limits without redesigning the PCB layout.",
  },
  "WE-SL2": {
    name: "WE-SL2 SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Two-line SMT common mode filter for differential pair signal integrity and EMC.",
    hint: "Place on RS-485 or CAN differential pairs at the board edge to suppress external cable-induced noise.",
  },
  "WE-SL3": {
    name: "WE-SL3 SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Three-line common mode filter for USB 2.0 (D+, D-, shield) with matched impedance.",
    hint: "Designed specifically for USB 2.0 — filters all three conductors simultaneously with matched winding balance.",
  },
  "WE-SL5-HC": {
    name: "WE-SL5 HC SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description: "High-current 5-line common mode filter for power-over-data interfaces.",
    hint: "Use on USB Power Delivery or PoE lines where both high current and strict EMC filtering are required.",
  },
  "WE-SL5": {
    name: "WE-SL5 SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "5-line SMT common mode filter for multi-conductor data cables and interfaces.",
    hint: "Filter 5-wire interfaces like USB 3.0 SuperSpeed (with VBUS) in a single compact SMT package.",
  },
  "WE-SL": {
    name: "WE-SL SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "General purpose SMT common mode line filter for differential signal EMC filtering.",
    hint: "Versatile filter for any differential pair — select impedance value to target the frequency band of concern.",
  },
  "WE-SCC": {
    name: "WE-SCC SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Compact SMT common mode choke with high common-mode impedance for signal line filtering.",
    hint: "Use on I2C or SPI lines to suppress common-mode noise from nearby switching converters.",
  },
  "WE-UCF": {
    name: "WE-UCF SMT Common Mode Line Filter",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Data Lines",
    description:
      "Ultra-compact common mode filter for space-constrained wearable and IoT PCB designs.",
    hint: "Smallest footprint common mode filter in the WE range — ideal for smartwatch or hearing aid PCB layouts.",
  },

  // --- EMC: COMMON MODE CHOKES (MAINS) ---
  "WE-CMBNC": {
    name: "WE-CMBNC Common Mode Choke Nanocrystalline",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description:
      "Nanocrystalline core common mode choke for superior mains filtering at low frequencies.",
    hint: "Use in EV chargers and industrial power supplies where very low-frequency common-mode noise must be attenuated.",
  },
  "WE-CMB-HC": {
    name: "WE-CMB HC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description:
      "High-current common mode choke for mains power filtering in high-power applications.",
    hint: "Place on mains input of motor drives or 3-phase inverters to meet conducted emissions standards at full load.",
  },
  "WE-CMBHV": {
    name: "WE-CMB HV Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "High-voltage rated common mode choke for mains filtering in 400V+ applications.",
    hint: "Required for industrial 3-phase equipment to filter common-mode currents on 400V AC mains inputs.",
  },
  "WE-CMB-NIZN": {
    name: "WE-CMB NiZn Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "NiZn core common mode choke for high-frequency mains noise suppression.",
    hint: "Effective at higher frequencies than MnZn types — use when switching frequency harmonics extend above 10 MHz.",
  },
  "WE-CMB": {
    name: "WE-CMB Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description:
      "Standard common mode power line choke for mains EMI filtering in SMPS and appliances.",
    hint: "Essential component in any mains power filter — blocks common-mode noise from switch-mode power supplies.",
  },
  "WE-EXB": {
    name: "WE-ExB Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description:
      "Extended bandwidth common mode choke covering a wide range of mains noise frequencies.",
    hint: "Use when a single choke must attenuate noise across a broad frequency range without multiple filter stages.",
  },
  "WE-CMBH": {
    name: "WE-CMBH Common Mode Choke Horizontal",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "Horizontal-mount common mode choke for low-profile mains filter assemblies.",
    hint: "Choose when PCB height is limited — horizontal orientation keeps the choke within the height envelope of nearby capacitors.",
  },
  "WE-LF-SMD": {
    name: "WE-LF SMT Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "SMT-mount common mode choke for automated assembly of mains power filters.",
    hint: "Drop-in SMT solution for mains filtering — enables fully automated PCB assembly without leaded components.",
  },
  "WE-LF": {
    name: "WE-LF Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "Leaded common mode choke for through-hole mains power line EMI suppression.",
    hint: "Standard through-hole choke for mains input filters in consumer electronics and white goods.",
  },
  "WE-TFC": {
    name: "WE-TFC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "Toroidal ferrite core common mode choke for high-performance mains filtering.",
    hint: "Toroidal geometry gives high inductance in a compact footprint — use where board space for filtering is limited.",
  },
  "WE-FC": {
    name: "WE-FC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "Flat-pack common mode choke for low-profile mains power line EMI filtering.",
    hint: "Use in slim power adapters or flat-panel display PSUs where vertical height is tightly constrained.",
  },
  "WE-LPCC": {
    name: "WE-LPCC Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "Low-profile common mode choke for space-efficient mains input filtering.",
    hint: "Fits into thin consumer device power stages — provides effective filtering within a 10mm height envelope.",
  },
  "WE-FCLP": {
    name: "WE-FCLP Common Mode Power Line Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "Flat core low-profile common mode choke for slim power supply filter stages.",
    hint: "Ideal for laptop power bricks and USB-C PD adapters requiring full mains filtering in minimal height.",
  },
  "WE-TPBHV": {
    name: "WE-TPB HV Three-Phase Common Mode Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description: "High-voltage three-phase common mode choke for industrial drive EMC filtering.",
    hint: "Install on the mains input of a 3-phase inverter drive to suppress common-mode currents on all three phases simultaneously.",
  },
  "WE-TPB": {
    name: "WE-TPB Three-Phase Common Mode Choke",
    category: "EMC Components",
    subcategory: "Common Mode Chokes — Mains",
    description:
      "Three-phase common mode power line choke for industrial motor drive EMC compliance.",
    hint: "Required at the mains input of 3-phase variable frequency drives to meet EN 61800-3 EMC standards.",
  },

  // --- EMC: ESD PROTECTION ---
  "WE-TVS-HS": {
    name: "WE-TVS TVS Diode — High Speed Series",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "High-speed TVS diode with low capacitance for ESD protection of fast data interfaces.",
    hint: "Place on USB, HDMI, or DisplayPort lines to clamp ESD transients without loading the high-speed signal.",
  },
  "WE-TVS-SUPER-SPEED": {
    name: "WE-TVS TVS Diode — Super Speed Series",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "Ultra-low capacitance TVS diode for ESD protection of multi-gigabit data lines.",
    hint: "Use on PCIe Gen 4 or USB 3.2 lines — sub-pF capacitance ensures no signal integrity degradation at 10+ Gbps.",
  },
  "WE-TVS": {
    name: "WE-TVS TVS Diode — Standard Series",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "Standard TVS diode for robust ESD and surge protection on power and I/O lines.",
    hint: "Mount as close as possible to the connector it protects to minimise the stub length and maximise clamping effectiveness.",
  },
  "WE-VE-ULC": {
    name: "WE-VE ULC ESD Suppressor",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "Ultra-low capacitance ESD suppressor for protecting RF antenna lines and ports.",
    hint: "Use on antenna feed lines where ESD protection is needed but even femtofarad-level capacitance would detune the antenna.",
  },
  "WE-VE_FEMTOF": {
    name: "WE-VE femtoF ESD Suppressor",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "Femtofarad-capacitance ESD suppressor for the most capacitance-sensitive RF and mmWave lines.",
    hint: "The lowest capacitance ESD device in the WE range — essential for 5G mmWave front-end protection.",
  },
  "WE-VE": {
    name: "WE-VE ESD Suppressor",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "General purpose ESD suppressor for protection of digital I/O and communication ports.",
    hint: "Add to every external-facing I/O pin to protect against human-body model ESD events during handling.",
  },
  "WE-VEA": {
    name: "WE-VEA ESD Suppressor Array",
    category: "EMC Components",
    subcategory: "ESD Protection",
    description:
      "Multi-channel ESD suppressor array for protecting multiple I/O lines simultaneously.",
    hint: "Use on multi-pin connectors (GPIO headers, LCD interfaces) to protect all lines with a single compact package.",
  },

  // --- EMC: SURGE PROTECTION ---
  "WE-TVSP": {
    name: "WE-TVSP Power TVS Diode",
    category: "EMC Components",
    subcategory: "Surge Protection",
    description:
      "High-power TVS diode for surge and transient overvoltage protection on power rails.",
    hint: "Place on the output of a power supply to clamp lightning-induced surges before they reach downstream components.",
  },
  "WE-VS": {
    name: "WE-VS SMT Varistor",
    category: "EMC Components",
    subcategory: "Surge Protection",
    description:
      "SMT metal oxide varistor for overvoltage and surge protection on mains and signal lines.",
    hint: "Connect across the mains input in parallel with the load to clamp surge voltages and protect downstream circuitry.",
  },
  "WE-VD": {
    name: "WE-VD Disk Varistor",
    category: "EMC Components",
    subcategory: "Surge Protection",
    description:
      "Through-hole disk varistor for high-energy surge protection on AC mains power inputs.",
    hint: "Install between live and neutral at the mains entry point to absorb lightning and switching surge energy.",
  },
};

/**
 * Live component folders (those with a usable model in public/models).
 * Generated from the WEComponents/ scan — keep in sync with the copy script.
 */
export const folders: string[] = [
  "earthing belt",
  "Ferrite WE-WAFB Sleeve Choke",
  "Shielding Cabinet Clip",
  "STP_WE-STAR-BUENO",
  "STP_WE-STAR-FLAT",
  "STP_WE-STAR-GAP",
  "STP_WE-STAR-Ring",
  "STP_WE-START-TEC",
  "STP_WEStarTecLFS",
  "WCAP-CSSA Interference Suppression",
  "WCAP-FTX2 Film Capacitors",
  "WCAP-FTXH Film Capacitors",
  "WCAP-FTXX Film Capacitors",
  "WCAP-FTY2 Film Capacitors",
  "WE_FC Common Mode POwer Line Choke",
  "WE_TPB Three Phase common Mode Power Line Choke",
  "WE-AFB",
  "WE-AFB LFS",
  "WE-CCMF Ceramic Common Mode Filter",
  "WE-CCMF Common Mode Filter",
  "WE-CLFS Line Filter",
  "WE-CMB HV Common Mode Power Line Choke",
  "We-CMB NiZn Common Mode Power Line Choke",
  "WE-CMBH Commmon Mode Power Line Choke(Verticale)",
  "WE-CMBNC Common Mode Power Line Choke Nanocrystalline",
  "WE-CNSW HF SMT Common Mode Line Filter",
  "WE-CNSW SMT Common Mode Line Filter Extended",
  "WE-CPU EMI Suppression CPU Ferrite Plate",
  "WE-CSGS Contact Spring Gasket",
  "WE-EGS Conductive Elastomer Gasket",
  "WE-EMIP EMI Patch",
  "WE-ExB Common Mode Power line choke",
  "WE-FAS Flexible Absorber Sheet",
  "We-FCLP Common Mode Power Line Choke",
  "WE-FI Leaded torodial Line Choke",
  "WE-FLAT",
  "WE-FLAT Wire High Current SMT Ferrite",
  "WE-FSFS Flexible Sintered Ferrite Sheet",
  "WE-LF Common Mode Power Line Choke",
  "WE-LF SMD Common Mode Power Line Choke in SMT",
  "We-LPCC Common Mode Power Line Choke",
  "WE-LQ SMT Inductor",
  "WE-LS Conductive Foam",
  "WE-LT Conductive Shielding Gasket",
  "WE-LT Halogen Free Conductive Shielding Gasket",
  "WE-MI SMT Multilayer Inductor",
  "WE-MLS Multiline AMI Suppression",
  "WE-NCC Nanocrystalline Cores",
  "WE-PD2 SMT Power Inductor",
  "WE-PF SMT EMI Suppression Power Ferrite",
  "WE-RCIS Rod Core Inductor SMT",
  "WE-RCIT Rod Core Inductor THT",
  "WE-RIB",
  "WE-SECF SMT EMI Contact Finger",
  "WE-SHC Seamless Shielding Cabinet",
  "WE-SHC Shielding Cabinet",
  "WE-SI Leaded Toroidal Storage Choke",
  "WE-SL2 SMT Common Mode Line Filter",
  "WE-SL5 HC SMT Common Mode Line Filter",
  "WE-SMGS Surface Mount Solderable Gasket",
  "WE-ST Conductive NiCu Glass Fibre Woven",
  "WE-SUKW SMT EMI Suppression 5-Hole Ferrite Bead",
  "WE-TFC Common Mode Power Line Choke",
  "WE-TI Radial Leaded Wire Wound Inductor",
  "WE-TOF",
  "We-TPB HV Three Phase common Mode Power Line Choke",
  "WE-TVS TVS Diode - High Speed Series",
  "WE-TVS TVS Diode - Super Speed Series",
  "WE-TVSP Power TVS Diode",
  "WE-UCF SMT Common Mode Line Filter",
  "We-UKW EMI Supression 6-Hole Ferrite Bead",
  "WE-VD Disk Varistor",
  "WE-VE ESD Suppressor",
  "WE-VE femtoF",
  "WE-VE ULC ESD Suppressor",
  "WE-VS SMT Varistor",
];

export function getComponentData(folderName: string) {
  // Try longest-match first to handle WE-CBF-HF before WE-CBF
  const keys = Object.keys(WE_PRODUCT_LOOKUP).sort((a, b) => b.length - a.length);
  const matchKey = keys.find((k) =>
    folderName.toUpperCase().includes(k.toUpperCase()),
  );
  if (matchKey) return WE_PRODUCT_LOOKUP[matchKey];

  // Fallback for unmatched
  return {
    name: folderName.replace(/[-_]/g, " "),
    category: "Components",
    subcategory: "General",
    description: `Würth Elektronik ${folderName} component.`,
    hint: `This component plays a role in your system. Refer to the WE datasheet for placement guidance.`,
  };
}

function buildComponentFromFolder(folder: string): WEComponent {
  const data = getComponentData(folder);
  return {
    id: folder,
    name: data.name,
    category: data.category as WEComponent["category"],
    subcategory: data.subcategory,
    partNumber: folder,
    shortDescription: data.description,
    hint: data.hint,
    modelPath: `/models/${folder}.gltf`,
    has3DModel: true,
  };
}

export const ALL_COMPONENTS: WEComponent[] = folders.map((folder) => {
  const base = buildComponentFromFolder(folder);
  const override = COMPONENT_OVERRIDES[folder] ?? {};
  // Manual overrides win over auto-generated data.
  return { ...base, ...override };
});

/** Unique categories present in the catalogue, in first-seen order. */
export const COMPONENT_CATEGORIES = Array.from(
  new Set(ALL_COMPONENTS.map((c) => c.category)),
);
