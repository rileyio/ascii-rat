import QtQuick
import Quickshell
import qs.Common
import qs.Modules.Plugins

// ASCII Rat bar widget: a pixel rat SVG in the bar. Click spawns the ASCII
// Rat page in a browser window (with the pixel welcome intro when enabled).
// NOTE: follows the DankMaterialShell plugin format; the bar-pill click uses
// a MouseArea because we launch an external window instead of a popout panel.
PluginComponent {
    id: root
    pluginId: "asciiRat"

    property string browserCommand: (pluginData.browserCommand ?? "firefox")
    property string repoPath: (pluginData.repoPath ?? "")
    property bool showIntro: (pluginData.showIntro ?? true)

    function launchRat() {
        let path = repoPath;
        if (!path) return;
        if (path.endsWith("/")) path = path.slice(0, -1);
        const url = "file://" + path + "/index.html" + (showIntro ? "?welcome=1" : "");
        Quickshell.execDetached(["sh", "-c", browserCommand + " '" + url + "'"]);
    }

    horizontalBarPill: Component {
        Row {
            property var widget: root
            Image {
                source: "icons/rat.svg"
                sourceSize.width: Theme.iconSize
                sourceSize.height: Theme.iconSize
                fillMode: Image.PreserveAspectFit
                anchors.verticalCenter: parent.verticalCenter

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.launchRat()
                }
            }
        }
    }

    verticalBarPill: Component {
        Column {
            property var widget: root
            Image {
                source: "icons/rat.svg"
                sourceSize.width: Theme.iconSize
                sourceSize.height: Theme.iconSize
                fillMode: Image.PreserveAspectFit
                anchors.horizontalCenter: parent.horizontalCenter

                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.launchRat()
                }
            }
        }
    }
}
