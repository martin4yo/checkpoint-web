import React from 'react'

interface MapMarkerIconProps {
  size?: number
  color?: string
  className?: string
}

export default function MapMarkerIcon({
  size = 24,
  color = '#EA4335',
  className = ''
}: MapMarkerIconProps) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {/* Sombra del marcador */}
        <path
          d="M50 115 C50 115, 20 85, 20 50 C20 33.43 33.43 20 50 20 C66.57 20 80 33.43 80 50 C80 85, 50 115, 50 115Z"
          fill="rgba(0, 0, 0, 0.2)"
          transform="translate(2, 4)"
        />

        {/* Cuerpo principal del marcador */}
        <path
          d="M50 110 C50 110, 20 80, 20 50 C20 33.43 33.43 20 50 20 C66.57 20 80 33.43 80 50 C80 80, 50 110, 50 110Z"
          fill={color}
        />

        {/* Borde superior más claro */}
        <path
          d="M50 20 C33.43 20 20 33.43 20 50 C20 52 20.2 54 20.5 56 C22 38 34 22 50 22 C66 22 78 38 79.5 56 C79.8 54 80 52 80 50 C80 33.43 66.57 20 50 20Z"
          fill="rgba(255, 255, 255, 0.3)"
        />

        {/* Círculo interior blanco */}
        <circle
          cx="50"
          cy="50"
          r="12"
          fill="white"
        />

        {/* Punto central */}
        <circle
          cx="50"
          cy="50"
          r="6"
          fill={color}
        />
      </g>
    </svg>
  )
}