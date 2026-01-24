import { useState } from "react";
import Header from "../components/Header";

type DocSection = "overview" | "copyright" | "identifiers" | "pro" | "workflow";

const docSections = [
  { id: "overview", label: "Overview" },
  { id: "copyright", label: "Copyright" },
  { id: "identifiers", label: "Global IDs" },
  { id: "pro", label: "PROs" },
  { id: "workflow", label: "IP Workflow" },
] as const;

export default function Docs() {
  const [activeSection, setActiveSection] = useState<DocSection>("overview");

  return (
    <div className="min-h-screen bg-theme-primary">
      <Header />

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-theme-primary mb-2">Documentation</h1>
          <p className="text-theme-secondary">Reference guide for protecting and monetizing your creative work</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {docSections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as DocSection)}
              className={`px-4 py-2 rounded text-sm whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? "btn-primary"
                  : "bg-theme-tertiary text-theme-secondary hover:text-theme-primary"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="card p-6 rounded-xl">
          {activeSection === "overview" && <OverviewSection />}
          {activeSection === "copyright" && <CopyrightSection />}
          {activeSection === "identifiers" && <IdentifiersSection />}
          {activeSection === "pro" && <PROSection />}
          {activeSection === "workflow" && <WorkflowSection />}
        </div>
      </main>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-6 text-theme-primary">
      <h2 className="text-xl font-bold mb-4">Protecting Your Creative Work</h2>
      
      <p className="text-theme-secondary leading-relaxed">
        As an independent music artist, protecting your intellectual property is essential for building a sustainable career. 
        This guide walks you through the key steps to register, protect, and monetize your creative work.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold mb-2">Why This Matters</h3>
          <ul className="text-sm text-theme-secondary space-y-1">
            <li>- Prove ownership of your work</li>
            <li>- Collect royalties from streams and plays</li>
            <li>- Protect against unauthorized use</li>
            <li>- Enable licensing opportunities</li>
          </ul>
        </div>
        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold mb-2">Key Components</h3>
          <ul className="text-sm text-theme-secondary space-y-1">
            <li>- Copyright registration</li>
            <li>- PRO membership (BMI/ASCAP)</li>
            <li>- Global identifiers (ISRC, UPC, ISWC)</li>
            <li>- Distribution platform</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CopyrightSection() {
  return (
    <div className="space-y-6 text-theme-primary">
      <h2 className="text-xl font-bold mb-4">Copyright Registration</h2>

      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg mb-2">What is Copyright?</h3>
          <p className="text-theme-secondary leading-relaxed">
            Copyright is automatic protection that exists the moment you create an original work in a fixed form 
            (recording, written notation, etc.). However, <strong>registering</strong> your copyright with the 
            U.S. Copyright Office provides additional legal benefits.
          </p>
        </div>

        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h4 className="font-bold mb-2">Benefits of Registration</h4>
          <ul className="text-sm text-theme-secondary space-y-2">
            <li><strong>Public Record:</strong> Creates official documentation of ownership</li>
            <li><strong>Legal Standing:</strong> Required to sue for infringement in federal court</li>
            <li><strong>Statutory Damages:</strong> Eligible for up to $150,000 per work if registered before infringement</li>
            <li><strong>Attorney's Fees:</strong> Can recover legal costs in successful lawsuits</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-2">Two Copyrights Per Song</h3>
          <p className="text-theme-secondary mb-3">
            Every song has two separate copyrights that can be registered:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-theme-tertiary p-4 rounded-lg">
              <h4 className="font-bold mb-1">PA (Performing Arts)</h4>
              <p className="text-sm text-theme-secondary">
                Covers the underlying musical composition - the melody, lyrics, and arrangement. 
                This is the "song" itself, separate from any recording.
              </p>
              <p className="text-sm text-accent mt-2">Cost: $45</p>
            </div>
            <div className="bg-theme-tertiary p-4 rounded-lg">
              <h4 className="font-bold mb-1">SR (Sound Recording)</h4>
              <p className="text-sm text-theme-secondary">
                Covers the specific recorded performance - the actual audio file. 
                This protects the production, vocals, and instrumentation as recorded.
              </p>
              <p className="text-sm text-accent mt-2">Cost: $65</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-secondary p-4 rounded-lg border-l-4 border-accent">
          <h4 className="font-bold mb-2">How to Register</h4>
          <ol className="text-sm text-theme-secondary space-y-1">
            <li>1. Visit <strong>copyright.gov</strong></li>
            <li>2. Create an account or log in</li>
            <li>3. Select "Register a Work"</li>
            <li>4. Choose PA or SR form</li>
            <li>5. Complete the application and upload your work</li>
            <li>6. Pay the filing fee ($45-$65)</li>
          </ol>
          <p className="text-xs text-theme-muted mt-3">Processing time: 3-10 months</p>
        </div>
      </div>
    </div>
  );
}

function IdentifiersSection() {
  return (
    <div className="space-y-6 text-theme-primary">
      <h2 className="text-xl font-bold mb-4">Global Identifiers</h2>

      <p className="text-theme-secondary mb-4">
        Global identifiers are unique codes that help track, report, and pay royalties for your music across platforms worldwide.
      </p>

      <div className="space-y-6">
        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">ISRC (International Standard Recording Code)</h3>
          <p className="text-sm text-theme-secondary mb-3">
            A unique 12-character code assigned to each specific recording of a song.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-theme-muted">Format:</p>
              <p className="font-mono">CC-XXX-YY-NNNNN</p>
            </div>
            <div>
              <p className="text-theme-muted">Example:</p>
              <p className="font-mono">US-S1Z-21-00001</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-theme-secondary">
            <p><strong>Who assigns:</strong> Distributors (DistroKid, TuneCore, CD Baby) or you can register as an ISRC manager</p>
            <p><strong>Cost:</strong> Usually free through distributors</p>
            <p><strong>Used for:</strong> Tracking streams, radio plays, and generating royalty reports</p>
          </div>
        </div>

        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">UPC (Universal Product Code)</h3>
          <p className="text-sm text-theme-secondary mb-3">
            A barcode for your release (single, EP, or album) - not individual tracks.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-theme-muted">Format:</p>
              <p className="font-mono">12-digit number</p>
            </div>
            <div>
              <p className="text-theme-muted">Example:</p>
              <p className="font-mono">012345678901</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-theme-secondary">
            <p><strong>Who assigns:</strong> Distributors typically provide these free</p>
            <p><strong>Cost:</strong> Usually included with distribution</p>
            <p><strong>Used for:</strong> Retail tracking, chart reporting, and sales data</p>
          </div>
        </div>

        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">ISWC (International Standard Musical Work Code)</h3>
          <p className="text-sm text-theme-secondary mb-3">
            Identifies the underlying composition (not the recording) - the songwriting.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-theme-muted">Format:</p>
              <p className="font-mono">T-NNNNNNNNN-C</p>
            </div>
            <div>
              <p className="text-theme-muted">Example:</p>
              <p className="font-mono">T-070237182-1</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-theme-secondary">
            <p><strong>Who assigns:</strong> Your PRO (BMI, ASCAP, SESAC) when you register the work</p>
            <p><strong>Cost:</strong> Free through PRO membership</p>
            <p><strong>Used for:</strong> Tracking performance royalties globally</p>
          </div>
        </div>

        <div className="bg-theme-secondary p-4 rounded-lg border-l-4 border-accent">
          <h4 className="font-bold mb-2">Quick Reference</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-theme-muted">
                <th className="text-left py-1">ID</th>
                <th className="text-left py-1">Covers</th>
                <th className="text-left py-1">Get From</th>
              </tr>
            </thead>
            <tbody className="text-theme-secondary">
              <tr>
                <td className="py-1 font-mono">ISRC</td>
                <td className="py-1">Recording</td>
                <td className="py-1">Distributor</td>
              </tr>
              <tr>
                <td className="py-1 font-mono">UPC</td>
                <td className="py-1">Release</td>
                <td className="py-1">Distributor</td>
              </tr>
              <tr>
                <td className="py-1 font-mono">ISWC</td>
                <td className="py-1">Composition</td>
                <td className="py-1">PRO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PROSection() {
  return (
    <div className="space-y-6 text-theme-primary">
      <h2 className="text-xl font-bold mb-4">Performance Rights Organizations (PROs)</h2>

      <p className="text-theme-secondary mb-4">
        PROs collect royalties when your music is publicly performed - radio, TV, venues, streaming, and more. 
        You must join one to collect these royalties.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">BMI</h3>
          <p className="text-sm text-theme-secondary mb-3">
            Broadcast Music, Inc. - One of the largest PROs in the US.
          </p>
          <ul className="text-sm text-theme-secondary space-y-1">
            <li><strong>Cost:</strong> FREE for songwriters</li>
            <li><strong>Publisher fee:</strong> $150 (one-time)</li>
            <li><strong>Payout:</strong> Quarterly</li>
            <li><strong>Website:</strong> bmi.com</li>
          </ul>
        </div>

        <div className="bg-theme-tertiary p-4 rounded-lg">
          <h3 className="font-bold text-lg mb-2">ASCAP</h3>
          <p className="text-sm text-theme-secondary mb-3">
            American Society of Composers, Authors and Publishers.
          </p>
          <ul className="text-sm text-theme-secondary space-y-1">
            <li><strong>Cost:</strong> $50 (one-time)</li>
            <li><strong>Publisher fee:</strong> $50 (one-time)</li>
            <li><strong>Payout:</strong> Quarterly</li>
            <li><strong>Website:</strong> ascap.com</li>
          </ul>
        </div>
      </div>

      <div className="bg-theme-tertiary p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-2">SESAC</h3>
        <p className="text-sm text-theme-secondary mb-3">
          Invitation-only PRO that represents select artists.
        </p>
        <ul className="text-sm text-theme-secondary">
          <li><strong>Cost:</strong> Free (by invitation)</li>
          <li><strong>Note:</strong> Smaller roster, more personalized service</li>
        </ul>
      </div>

      <div className="bg-theme-secondary p-4 rounded-lg border-l-4 border-accent">
        <h4 className="font-bold mb-2">Important Notes</h4>
        <ul className="text-sm text-theme-secondary space-y-2">
          <li><strong>Choose one:</strong> You can only be a member of ONE PRO at a time</li>
          <li><strong>Register works:</strong> After joining, you must register each song to collect royalties</li>
          <li><strong>Co-writers:</strong> Each co-writer needs their own PRO membership</li>
          <li><strong>Publishing:</strong> Consider registering as your own publisher to collect both writer AND publisher share</li>
        </ul>
      </div>

      <div>
        <h3 className="font-bold text-lg mb-2">Royalty Types PROs Collect</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {["Radio Airplay", "TV/Film Sync", "Live Venues", "Streaming", "Retail/Restaurants", "Digital Radio", "Airlines", "Hotels"].map(type => (
            <div key={type} className="bg-theme-tertiary p-2 rounded text-center text-sm text-theme-secondary">
              {type}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowSection() {
  const steps = [
    {
      step: 1,
      title: "Fix Your Work",
      description: "Record or document your music in a tangible form (audio file, sheet music, written lyrics).",
      cost: "FREE",
      time: "Immediate",
      tips: ["Keep dated backups", "Email yourself a copy for timestamp", "Store securely"]
    },
    {
      step: 2,
      title: "Register Copyright",
      description: "File with the U.S. Copyright Office to create an official public record of ownership.",
      cost: "$45-$65",
      time: "3-10 months",
      tips: ["Register PA for composition", "Register SR for recording", "Can register multiple works together"]
    },
    {
      step: 3,
      title: "Join a PRO",
      description: "Sign up with BMI, ASCAP, or SESAC to collect performance royalties.",
      cost: "FREE-$50",
      time: "1-2 weeks",
      tips: ["BMI is free for writers", "ASCAP is $50 one-time", "Only join ONE PRO"]
    },
    {
      step: 4,
      title: "Register Your Composition",
      description: "Register your songs with your PRO to receive an ISWC and start collecting royalties.",
      cost: "FREE",
      time: "2-4 weeks",
      tips: ["Include all co-writers", "Add accurate metadata", "Update if info changes"]
    },
    {
      step: 5,
      title: "Upload to Distributor",
      description: "Use a distributor (DistroKid, TuneCore, CD Baby) to get on Spotify, Apple Music, etc.",
      cost: "$0-$30/year",
      time: "1-2 weeks",
      tips: ["You'll get ISRC and UPC codes", "Set a release date", "Prepare artwork (3000x3000)"]
    },
    {
      step: 6,
      title: "Release & Monitor",
      description: "Track your streams, royalties, and usage across platforms.",
      cost: "FREE",
      time: "Ongoing",
      tips: ["Check PRO statements quarterly", "Monitor distributor dashboard", "Track with BOX"]
    }
  ];

  return (
    <div className="space-y-6 text-theme-primary">
      <h2 className="text-xl font-bold mb-4">IP Protection Workflow</h2>

      <p className="text-theme-secondary mb-6">
        Follow these 6 steps to fully protect and monetize your music. Each step builds on the previous one.
      </p>

      <div className="space-y-4">
        {steps.map(step => (
          <div key={step.step} className="bg-theme-tertiary p-4 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full btn-primary flex items-center justify-center font-bold">
                {step.step}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-theme-secondary text-theme-muted">{step.cost}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-theme-secondary text-theme-muted">{step.time}</span>
                </div>
                <p className="text-sm text-theme-secondary mb-3">{step.description}</p>
                <div className="flex flex-wrap gap-2">
                  {step.tips.map((tip, i) => (
                    <span key={i} className="text-xs bg-theme-secondary px-2 py-1 rounded text-theme-muted">
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-theme-secondary p-4 rounded-lg border-l-4 border-accent mt-6">
        <h4 className="font-bold mb-2">Pro Tip: Track Everything in BOX</h4>
        <p className="text-sm text-theme-secondary">
          Use your project pages to store all identifiers (ISRC, UPC, ISWC, copyright registration numbers) 
          and track which steps you've completed for each release.
        </p>
      </div>
    </div>
  );
}
