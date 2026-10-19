import QtQuick
import QtQuick.Layouts
import qs.Common
import qs.Modules.Plugins

PluginSettings {
    pluginId: "asciiRat"

    ColumnLayout {
        spacing: Theme.spacing.md

        StringSetting {
            settingKey: "browserCommand"
            label: "Browser command"
            description: "Browser (or WebEngine-capable launcher) used to open the ASCII Rat window"
            defaultValue: "firefox"
        }

        StringSetting {
            settingKey: "repoPath"
            label: "ASCII Rat repo path"
            description: "Absolute path to your ascii-rat checkout (the folder containing index.html)"
            defaultValue: ""
        }

        ToggleSetting {
            settingKey: "showIntro"
            label: "Welcome intro"
            description: "Play the pixel welcome animation (dot-pattern WELCOME + pixel moon) when the window opens"
            defaultValue: true
        }
    }
}
