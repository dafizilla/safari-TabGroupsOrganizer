if (typeof(tabgroup) == 'undefined') {
    tabgroup = {};
}

(function() {
    this.saveGroup = function() {
        var groupName = window.prompt("Enter the name for tabs group");
	if (groupName) {
            var tabs = safari.application.activeBrowserWindow.tabs;
            var urls = [];
            var settingsUrl = safari.extension.baseURI + "settings/settings.html";

            for (var i = 0; i < tabs.length; i++) {
                var tab = tabs[i];
                if (tab.url != settingsUrl) {
                    urls.push({title: tab.title, url: tab.url});
                }
            }
            var list = [];
            if (safari.extension.settings.names) {
                list = safari.extension.settings.names;
            }
            list.push(groupName);
            // update the persisted list
            safari.extension.settings.names = list;
            safari.extension.settings["grp_" + groupName] = urls;
        }
    }

    this.restoreGroup = function(groupName) {
	if (groupName) {
            var urls = safari.extension.settings['grp_' + groupName];
            var win = safari.application.activeBrowserWindow;
            var last = urls.length - 1;
            for (var i = 0; i < urls.length; i++) {
                if (urls[i]) {
                    win.openTab(i == last ? "foreground" : "background").url = urls[i].url;
                }
            }
        }
    }

    this.removeGroup = function(groupName) {
        var list = safari.extension.settings.names;
        var index = list.indexOf(groupName);

        if (index >= 0) {
            list.splice(index, 1);
            safari.extension.settings.names = list;
            delete safari.extension.settings["grp_" + groupName];
        }
    }

    this.importGroups = function(jsonString) {
	try {
	    var list = JSON.parse(jsonString);
	    var names = [];
	    for (var i in list) {
		var group = list[i];
		var groupName = group.name;
		safari.extension.settings["grp_" + groupName] = group.urls;
		names.push(groupName);
	    }
	    safari.extension.settings.names = names;
	    alert('Imported ' + list.length + ' groups');
	} catch (err) {
	    alert('Error while importing: ' + err);
	}
    }

    this.exportGroups = function() {
        var list = safari.extension.settings.names;
	var allGroups = [];

	for (var i in list) {
	    var groupName = list[i];
	    allGroups.push({name: groupName,
			   urls: safari.extension.settings["grp_" + groupName]});
	}
	return JSON.stringify(allGroups);
    }

    function openSettingsDialog() {
	var settingsUrl = safari.extension.baseURI + "settings/settings.html";
        var currentTabs = safari.application.activeBrowserWindow.tabs;

        for (var i = 0; i < currentTabs.length; i++) {
	    var tab = currentTabs[i];

            if (tab.url == settingsUrl) {
		tab.activate();
		return;
            }
        }
	safari.application.activeBrowserWindow
		    .openTab("foreground")
		    .url = settingsUrl;
    }

    function handleMessage(messageEvent) {
        switch (messageEvent.name) {
            case 'requestList':
                safari.application.activeBrowserWindow.activeTab.page
		    .dispatchMessage("getGroups", safari.extension.settings.names);
                break;
            case 'requestGroupUrls':
                safari.application.activeBrowserWindow.activeTab.page
		    .dispatchMessage("getGroupUrls", safari.extension.settings['grp_' + messageEvent.message]);
                break;
            case 'requestRemoveGroup':
                tabgroup.removeGroup(messageEvent.message);
                safari.application.activeBrowserWindow.activeTab.page
		    .dispatchMessage("getGroups", safari.extension.settings.names);
		break;
            case 'saveGroup':
                tabgroup.saveGroup(messageEvent.message);
                safari.application.activeBrowserWindow.activeTab.page
		    .dispatchMessage("getGroups", safari.extension.settings.names);
		break;
            case 'restoreGroup':
                tabgroup.restoreGroup(messageEvent.message);
		break;
            case 'exportGroups':
                safari.application.activeBrowserWindow.activeTab.page
		    .dispatchMessage("getExportedGroups", tabgroup.exportGroups());
		break;
            case 'importGroups':
		if (confirm('The import process will delete all previous groups. Continue?')) {
		    tabgroup.importGroups(messageEvent.message);
		    safari.application.activeBrowserWindow.activeTab.page
			.dispatchMessage("getGroups", safari.extension.settings.names);
		}
		break;
       }
    }

    function handleCommand(event) {
        switch (event.command) {
            case 'openSettingsDialog':
                openSettingsDialog();
                break;
        }
    }

    this.onLoad = function(event) {
        safari.application.addEventListener("message", handleMessage, false);
        safari.application.addEventListener("command", handleCommand, false);
    }
}).apply(tabgroup);