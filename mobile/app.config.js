const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "development"
const variants = {
  development: {
    nameSuffix: " Dev",
    packageSuffix: ".dev",
    iconFolder: "development",
    adaptiveIconBackgroundColor: "#0ea5e9",
  },
  preview: {
    nameSuffix: " Preview",
    packageSuffix: ".preview",
    iconFolder: "preview",
    adaptiveIconBackgroundColor: "#7c3aed",
  },
  production: {
    nameSuffix: "",
    packageSuffix: "",
    iconFolder: "production",
    adaptiveIconBackgroundColor: "#111827",
  },
}
const variant = variants[appEnv] ?? variants.development
const iconRoot = `./assets/icons/${variant.iconFolder}`

module.exports = {
  expo: {
    name: `lily${variant.nameSuffix}`,
    slug: "lily",
    version: "1.0.0",
    scheme: ["lily", "vscode"],
    icon: `${iconRoot}/icon.png`,
    android: {
      package: `lol.calf.lily${variant.packageSuffix}`,
      adaptiveIcon: {
        foregroundImage: `${iconRoot}/adaptive-icon.png`,
        backgroundColor: variant.adaptiveIconBackgroundColor,
      },
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "5d6ea08b-3c6a-44ce-a2a3-d391e0464396",
      },
    },
  },
}
