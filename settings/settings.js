if (typeof(tabGroupsSettingsDialog) == 'undefined') {
    tabGroupsSettingsDialog = {};
}

(function() {
    var groupsList;
    var groupUrls;
    var selectedUrl;
    var removeGroup;
    var removeUrl;

    this.onLoad = function(event) {
        groupsList = document.getElementById('groupsList');
        groupUrls = document.getElementById('groupUrls');
        selectedUrl = document.getElementById('selectedUrl');
        removeGroup = document.getElementById('removeGroup');
        removeUrl = document.getElementById('removeUrl');
        restoreGroup = document.getElementById('restoreGroup');
        saveGroup = document.getElementById('saveGroup');
        importGroups = document.getElementById('importGroups');
        exportGroups = document.getElementById('exportGroups');
        importExportText = document.getElementById('importExportText');

        addListeners();
        safari.self.tab.dispatchMessage("requestList", null);
    }

    function addListeners() {
        // refresh dialog content if multiple tabs are open on it
        window.addEventListener('focus', function() {
            safari.self.tab.dispatchMessage("requestList", null);
        });

        groupsList.addEventListener('change', function() {
            selectedUrl.value = '';
            safari.self.tab.dispatchMessage("requestGroupUrls", this.value);
        });
        groupsList.addEventListener('dblclick', function() {
            safari.self.tab.dispatchMessage("restoreGroup", groupsList.value);
        });
        groupUrls.addEventListener('change', function() {
            selectedUrl.value = this.value;
        });
        removeGroup.addEventListener('click', function() {
            if (groupsList.length) {
                if (confirm('Delete selected group?')) {
                    safari.self.tab.dispatchMessage("requestRemoveGroup", groupsList.value);
                }
            }
        });
        removeUrl.addEventListener('click', function() {
            if (groupUrls.length) {
                if (confirm('Delete selected url?')) {
                    safari.self.tab.dispatchMessage("requestDeleteUrl", groupUrls.value);
                }
            }
        });
        saveGroup.addEventListener('click', function() {
            safari.self.tab.dispatchMessage("saveGroup", null);
        });
        restoreGroup.addEventListener('click', function() {
            safari.self.tab.dispatchMessage("restoreGroup", groupsList.value);
        });
        exportGroups.addEventListener('click', function() {
            safari.self.tab.dispatchMessage("exportGroups", groupsList.value);
        });
        importGroups.addEventListener('click', function() {
            if (!importExportText.value) {
                alert('No text to import');
                return;
            }
            safari.self.tab.dispatchMessage("importGroups", importExportText.value);
        });

        safari.self.addEventListener("message", handleMessage, false);
    }

    function getGroups(names) {
       clearList(groupsList);
       clearList(groupUrls);
       selectedUrl.value = '';

       for (var i in names) {
          var name = names[i];
          appendOption(groupsList, name, name);
       }
    }

    function fillGroupUrls(urlsMap) {
       clearList(groupUrls);

       for (var i in urlsMap) {
          var url = urlsMap[i];
          appendOption(groupUrls, url.title, url.url);
       }
    }

    function clearList(list) {
       for (var i = list.length - 1; i >= 0; i--) {
          list.remove(i);
       }
    }

    function appendOption(list, label, value) {
       var option = document.createElement('option');

       option.setAttribute('value', value);
       option.appendChild(document.createTextNode(label));
       list.appendChild(option);
    }

    function handleMessage(messageEvent) {
       switch (messageEvent.name) {
          case 'getGroups':
             getGroups(messageEvent.message);
             break;
          case 'getGroupUrls':
             fillGroupUrls(messageEvent.message);
             break;
        case 'getExportedGroups':
            importExportText.value = messageEvent.message;
            break;
       }
    }

    this.selectMenu = function(menuId) {
        var nl = document.querySelectorAll('#tabs a');
        for (var i = 0; i < nl.length; i++) {
            var menu = nl[i];
            var isSelected = menuId == menu.id;
            menu.setAttribute('class', isSelected ? 'selected' : '');
            document.getElementById(menu.id + "Panel").style.display = isSelected ? 'block' : 'none';
        }
    }
}).apply(tabGroupsSettingsDialog);