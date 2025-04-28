import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'mediaphoto.mnhn.fr',
      },
      {
        protocol: 'https',
        hostname: 'api.gbif.org',
      },
      {
        protocol: 'https',
        hostname: 'tile.gbif.org',
      },
      {
        protocol: 'https',
        hostname: 'inaturalist-open-data.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.inaturalist.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'macroalgae.org',
      },
      {
        protocol: 'https',
        hostname: 'oxalis.br.fgov.be',
      },
      {
        protocol: 'http',
        hostname: 'sweetgum.nybg.org',
      },
      {
        protocol: 'http',
        hostname: 'procyon.acadiau.ca',
      },
      {
        protocol: 'https',
        hostname: 'media.tepapa.govt.nz',
      },
      {
        protocol: 'https',
        hostname: 'quod.lib.umich.edu',
      },
      {
        protocol: 'https',
        hostname: 'bs.plantnet.org',
      },
      {
        protocol: 'https',
        hostname: 'www.artsobservasjoner.no',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'medialib.naturalis.nl',
      },
      {
        protocol: 'http',
        hostname: 'www.boldsystems.org',
      },
      {
        protocol: 'http',
        hostname: 'media.api.aucklandmuseum.com',
        pathname: '/id/media/**',
      },
      {
        protocol: 'https',
        hostname: 'images.ala.org.au',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'n2t.net',
        pathname: '/ark:/**',
      },
      {
        protocol: 'https',
        hostname: 'farm66.staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: '*.staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'arter.dk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.floridamuseum.ufl.edu',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'svampe.databasen.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'observation.org',
        pathname: '/photos/**',
      },
      {
        protocol: 'https',
        hostname: 'data.nhm.ac.uk',
      },
      {
        protocol: 'https',
        hostname: 'images.gbif.org',
      },
      {
        protocol: 'http',
        hostname: 'api.idigbio.org',
      },
      {
        protocol: 'https',
        hostname: 'api.idigbio.org',
      },
      {
        protocol: 'http',
        hostname: 'www.biodic.go.jp',
      }
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

export default nextConfig;
