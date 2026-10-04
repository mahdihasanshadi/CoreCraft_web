import Image from 'next/image'
import Link from 'next/link'

export interface CategoryTileViewModel {
  readonly key: string
  readonly title: string
  readonly href: string
  readonly countLabel: string
  readonly image: {readonly src: string; readonly alt: string} | null
}

/** Garment-type doors. Two across on phones, four on desktop. */
export function CategoryTiles({tiles}: {tiles: readonly CategoryTileViewModel[]}) {
  if (tiles.length === 0) return null
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {tiles.map((tile) => (
        <li key={tile.key}>
          <Link
            href={tile.href}
            className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-surface-sunken"
          >
            {tile.image && (
              <Image
                src={tile.image.src}
                alt={tile.image.alt}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
              />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
              <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{tile.title}</h3>
              <p className="mt-0.5 text-xs text-white/75">{tile.countLabel}</p>
              <span className="mt-3 inline-flex h-8 items-center rounded-full bg-white/15 px-3 text-xs font-medium backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-black">
                Shop now
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
