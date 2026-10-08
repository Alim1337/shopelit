import Link from "next/link";
import { ArrowLeft, Ruler } from "lucide-react";

const MOUSE_SIZES = [
  { category: "Ultra-légère", weight: "< 65g", longueur: "< 120mm", exemple: "Cible les joueurs FPS, grip précis" },
  { category: "Compacte", weight: "65–85g", longueur: "120–125mm", exemple: "Polyvalente, petites mains" },
  { category: "Standard", weight: "85–100g", longueur: "125–135mm", exemple: "Mains moyennes, tous styles" },
  { category: "Grande", weight: "> 100g", longueur: "> 135mm", exemple: "Grandes mains, palm grip confortable" },
];

const DESK_PADS = [
  { taille: "S", dimensions: "350 × 250 mm", usage: "Petit bureau, clavier compact" },
  { taille: "M", dimensions: "450 × 400 mm", usage: "Setup standard" },
  { taille: "L", dimensions: "800 × 300 mm", usage: "Grand bureau, clavier full-size" },
  { taille: "XXL", dimensions: "900 × 400 mm", usage: "Double écran, setup immersif" },
];

const KEYBOARD_FORMATS = [
  { format: "Full-size (100%)", touches: "104 touches", avantages: "Pavé numérique inclus, toutes fonctions" },
  { format: "TKL (80%)", touches: "87 touches", avantages: "Sans pavé num, plus de place pour la souris" },
  { format: "65%", touches: "68 touches", avantages: "Ultra-compact, flèches directionnelles conservées" },
  { format: "60%", touches: "61 touches", avantages: "Minimaliste, port idéal en déplacement" },
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour au Centre d&apos;aide
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <Ruler className="h-5 w-5 text-indigo-600" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Guide des Tailles</h1>
      </div>
      <p className="text-slate-500 mb-10">
        Choisissez les bons périphériques selon votre morphologie et votre style de jeu.
      </p>

      {/* Souris */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Souris Gaming</h2>
        <p className="text-sm text-slate-500 mb-4">Le poids et la longueur dépendent de votre type de grip et de la taille de votre main.</p>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Catégorie</th>
                <th className="text-left px-4 py-3 font-medium">Poids</th>
                <th className="text-left px-4 py-3 font-medium">Longueur</th>
                <th className="text-left px-4 py-3 font-medium">Profil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {MOUSE_SIZES.map((row) => (
                <tr key={row.category}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.category}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.weight}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.longueur}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{row.exemple}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claviers */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Format Clavier</h2>
        <p className="text-sm text-slate-500 mb-4">Le format détermine l&apos;espace disponible sur votre bureau et les touches présentes.</p>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Format</th>
                <th className="text-left px-4 py-3 font-medium">Touches</th>
                <th className="text-left px-4 py-3 font-medium">Avantages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {KEYBOARD_FORMATS.map((row) => (
                <tr key={row.format}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.format}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.touches}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{row.avantages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tapis */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Tapis de Souris</h2>
        <p className="text-sm text-slate-500 mb-4">Choisissez le format selon la taille de votre bureau et votre sensibilité de jeu.</p>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Taille</th>
                <th className="text-left px-4 py-3 font-medium">Dimensions</th>
                <th className="text-left px-4 py-3 font-medium">Recommandé pour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {DESK_PADS.map((row) => (
                <tr key={row.taille}>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{row.taille}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.dimensions}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{row.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Les dimensions indiquées sont générales. Consultez la fiche produit pour les mesures exactes de chaque article.
      </p>
    </div>
  );
}
