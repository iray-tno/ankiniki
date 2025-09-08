# Troubleshooting Guide

This comprehensive troubleshooting guide covers common issues across all Ankiniki components and their solutions.

## 🚨 Common Issues Across All Components

### AnkiConnect Connection Issues

#### Issue: "Cannot connect to AnkiConnect" / "Connection refused"

**Symptoms:**

- Error messages about connection failures
- Timeouts when trying to communicate with Anki
- Extension/CLI/Desktop app showing offline status

**Solutions:**

1. **Verify Anki is running**:

   ```bash
   # Check if Anki process is running (Linux/Mac)
   ps aux | grep -i anki

   # Check if port 8765 is listening (Linux/Mac)
   netstat -an | grep 8765

   # Windows equivalent
   tasklist | findstr anki
   netstat -an | findstr 8765
   ```

2. **Verify AnkiConnect addon is installed**:
   - Open Anki → Tools → Add-ons
   - Look for "AnkiConnect" in the list
   - If missing, install with code: `2055492159`
   - **Restart Anki after installation**

3. **Test AnkiConnect directly**:

   ```bash
   # Test basic connectivity
   curl -X POST http://localhost:8765 \
     -H "Content-Type: application/json" \
     -d '{"action": "version", "version": 6}'

   # Expected response: {"result": 6, "error": null}
   ```

4. **Check CORS configuration**:
   - Go to Tools → Add-ons → AnkiConnect → Config
   - Ensure your domain/localhost is in `webCorsOriginList`
   - Default should include `http://localhost`

5. **Firewall/Security issues**:
   - Temporarily disable firewall to test
   - Add Anki to firewall exceptions
   - Check antivirus blocking connections

#### Issue: "AnkiConnect Error: [specific error message]"

**Solutions:**

- **"deck was not found"**: Create the deck in Anki first
- **"model was not found"**: Use existing note type (usually "Basic")
- **"cannot create note because it is a duplicate"**: Check duplicate settings
- **"note type has no field named X"**: Verify field names match note type

### Installation and Setup Issues

#### Issue: Node.js/npm version compatibility

**Symptoms:**

- Build failures during `npm install`
- "Engine not supported" errors
- TypeScript compilation errors

**Solutions:**

```bash
# Check versions
node --version  # Should be 18.0.0+
npm --version   # Should be 9.0.0+

# Update Node.js
# Visit nodejs.org and download latest LTS

# Update npm
npm install -g npm@latest

# Clear npm cache if issues persist
npm cache clean --force
```

#### Issue: Permission errors during installation

**Solutions:**

```bash
# Fix npm permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or configure npm to use different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add ~/.npm-global/bin to PATH
```

#### Issue: Build failures in monorepo

**Solutions:**

```bash
# Clean and rebuild everything
npm run clean
npm install
npm run build

# If specific package fails, build dependencies first
cd packages/shared && npm run build
cd ../backend && npm run build
cd ../../apps/cli && npm run build
```

## 🖥️ Desktop App Issues

### Startup and Launch Issues

#### Issue: App won't start / crashes on launch

**Solutions:**

1. **Check logs**:

   ```bash
   # View Electron logs
   cd apps/desktop
   npm run dev  # Look for error messages in terminal
   ```

2. **Clear app data**:
   - **Windows**: `%APPDATA%/ankiniki/`
   - **macOS**: `~/Library/Application Support/ankiniki/`
   - **Linux**: `~/.config/ankiniki/`

3. **Rebuild native modules**:
   ```bash
   cd apps/desktop
   npm run rebuild
   ```

#### Issue: White screen / app loads but shows nothing

**Solutions:**

1. **Enable DevTools for debugging**:
   - Add `--enable-devtools` flag or press `Ctrl+Shift+I`
   - Check console for JavaScript errors

2. **Check renderer process**:
   ```bash
   # Start in development mode
   cd apps/desktop
   npm run dev
   ```

### UI and Functionality Issues

#### Issue: Cards not displaying correctly

**Solutions:**

1. **Check card formatting**:
   - Verify HTML is properly escaped
   - Check if markdown rendering is enabled
   - Look for CSS conflicts

2. **Reset display settings**:
   - Go to Settings → Display → Reset to defaults

#### Issue: Sync/save operations fail

**Solutions:**

1. **Check AnkiConnect status** (see common issues above)
2. **Verify deck permissions**:
   - Ensure deck isn't locked in Anki
   - Check if Anki is in sync mode

## 💻 CLI Tool Issues

### Command Not Found Issues

#### Issue: `ankiniki: command not found`

**Solutions:**

```bash
# Ensure CLI is built and linked
cd apps/cli
npm run build
npm link

# Check if npm global bin is in PATH
echo $PATH | grep npm

# Add to PATH if missing (Linux/Mac)
echo 'export PATH="$PATH:$(npm prefix -g)/bin"' >> ~/.bashrc
source ~/.bashrc

# Windows - add npm global folder to PATH
# Usually: C:\Users\[username]\AppData\Roaming\npm
```

#### Issue: Permission errors when running commands

**Solutions:**

```bash
# Fix npm global permissions (Linux/Mac)
sudo chown -R $(whoami) $(npm prefix -g)

# Or use npx instead
npx ankiniki --help
```

### Configuration Issues

#### Issue: Config commands fail / settings not persisting

**Solutions:**

```bash
# Check config file location
ankiniki config --show

# Manually check/edit config file
# Location: ~/.config/ankiniki/config.json (Linux/Mac)
#           %APPDATA%\ankiniki\config.json (Windows)

# Reset configuration to defaults
ankiniki config --reset
```

#### Issue: Interactive prompts not working

**Solutions:**

1. **Check terminal compatibility**:
   - Use standard terminal (not IDE integrated terminal if issues)
   - Ensure TTY is available

2. **Update dependencies**:
   ```bash
   cd apps/cli
   npm update inquirer
   ```

### Card Creation Issues

#### Issue: Cards created but don't appear in Anki

**Solutions:**

1. **Check target deck**:

   ```bash
   # List available decks
   ankiniki list --decks

   # Verify deck name matches exactly
   ankiniki config --set defaultDeck="Exact Deck Name"
   ```

2. **Use Anki Browse feature**:
   - In Anki: Browse → search for recent cards
   - Search by tag: `tag:cli` or `tag:ankiniki`

## 🔧 VS Code Extension Issues

### Extension Not Loading / Activation Issues

#### Issue: Extension doesn't appear in VS Code

**Solutions:**

1. **Check VS Code version**:
   - Requires VS Code 1.74.0+
   - Update VS Code if necessary

2. **Manual installation from VSIX**:

   ```bash
   cd apps/vscode-extension
   npm run package
   # Install the generated .vsix file in VS Code
   ```

3. **Check extension host logs**:
   - Help → Toggle Developer Tools → Console
   - Look for extension-related errors

4. **Reload VS Code**:
   - `Ctrl+Shift+P` → "Developer: Reload Window"

#### Issue: Commands not appearing in Command Palette

**Solutions:**

1. **Check extension activation**:
   - Look for "Ankiniki" in Extensions view
   - Ensure it's enabled (not just installed)

2. **Verify commands are registered**:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Search for "Ankiniki" - should show all commands

3. **Check activation events**:
   - Commands may only be available when extension is activated
   - Try opening a code file first

### Keyboard Shortcuts Issues

#### Issue: Keyboard shortcuts not working

**Solutions:**

1. **Check for conflicts**:
   - File → Preferences → Keyboard Shortcuts
   - Search for conflicting shortcuts

2. **Reset to defaults**:
   - In Keyboard Shortcuts, find Ankiniki commands
   - Right-click → "Reset Keybinding"

3. **Manual shortcut assignment**:
   ```json
   // keybindings.json
   {
     "key": "ctrl+shift+a",
     "command": "ankiniki.addSelectedText",
     "when": "editorHasSelection"
   }
   ```

### Card Creation Issues

#### Issue: No text selected warning

**Solutions:**

- Select text before using `Ctrl+Shift+A`
- Use `Ctrl+Shift+Q` for quick add without selection
- Use `Ctrl+Shift+C` for current line if nothing selected

#### Issue: Language detection not working

**Solutions:**

1. **Check file extension**:
   - Ensure file has proper extension (.js, .py, .ts, etc.)
   - VS Code should show language in status bar

2. **Manual language override**:
   - Click language in status bar
   - Select correct language

3. **Check extension settings**:
   ```json
   {
     "ankiniki.autoDetectLanguage": true
   }
   ```

### Configuration Issues

#### Issue: Settings not saving / not found

**Solutions:**

1. **Check settings location**:
   - File → Preferences → Settings
   - Search for "Ankiniki"

2. **Manual configuration**:

   ```json
   // settings.json
   {
     "ankiniki.ankiConnectUrl": "http://localhost:8765",
     "ankiniki.defaultDeck": "Programming",
     "ankiniki.defaultModel": "Basic"
   }
   ```

3. **Reset extension settings**:
   - Remove all "ankiniki.\*" entries from settings.json
   - Restart VS Code

## 🌐 Network and Connectivity Issues

### Port and URL Issues

#### Issue: AnkiConnect on different port

**Solutions:**

```bash
# Check AnkiConnect configuration in Anki
# Tools → Add-ons → AnkiConnect → Config

# Update configuration in each component:

# CLI
ankiniki config --set ankiConnectUrl="http://localhost:8766"

# VS Code Extension
# Settings → ankiniki.ankiConnectUrl → http://localhost:8766

# Desktop App
# Settings → AnkiConnect URL → http://localhost:8766
```

#### Issue: Remote Anki instance

**Solutions:**

1. **Configure CORS in AnkiConnect**:

   ```json
   {
     "webCorsOriginList": ["http://localhost", "http://192.168.1.100", "https://your-domain.com"]
   }
   ```

2. **Update URLs in all components**:
   ```bash
   # Example for remote Anki at 192.168.1.100
   ankiniki config --set ankiConnectUrl="http://192.168.1.100:8765"
   ```

### Proxy and Firewall Issues

#### Issue: Corporate firewall blocking connections

**Solutions:**

1. **Configure proxy settings**:

   ```bash
   # Set npm proxy if needed
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

2. **Request IT exceptions**:
   - AnkiConnect port (default 8765)
   - Local development ports (3000, 3001, etc.)

## 🔍 Debugging and Diagnostics

### Logging and Debug Output

#### Enable Debug Mode

```bash
# CLI Debug Mode
ankiniki config --set debugMode=true
ankiniki add --debug "test" "test"

# Backend Debug Mode
NODE_ENV=development npm run dev

# Desktop App Debug Mode
# Enable DevTools in development builds
```

#### Check Log Files

- **Desktop App Logs**:
  - Windows: `%APPDATA%/ankiniki/logs/`
  - macOS: `~/Library/Logs/ankiniki/`
  - Linux: `~/.local/share/ankiniki/logs/`

- **CLI Logs**: Usually output to console

- **VS Code Extension**: Developer Tools Console

### Performance Issues

#### Issue: Slow card creation / high memory usage

**Solutions:**

1. **Check Anki performance**:
   - Large decks can slow operations
   - Consider deck reorganization

2. **Monitor system resources**:

   ```bash
   # Check memory usage
   top | grep anki
   top | grep node

   # Check disk space
   df -h
   ```

3. **Optimize configuration**:
   - Disable unnecessary features
   - Reduce concurrent operations

### Data Integrity Issues

#### Issue: Duplicate cards being created

**Solutions:**

1. **Check AnkiConnect duplicate settings**:

   ```json
   {
     "allowDuplicate": false,
     "duplicateScope": "deck"
   }
   ```

2. **Manual duplicate removal**:
   - Anki → Tools → Check Database
   - Browse → Find Duplicates

#### Issue: Card formatting/encoding problems

**Solutions:**

1. **Check character encoding**:
   - Ensure UTF-8 encoding in source files
   - Verify Anki database encoding

2. **HTML escaping issues**:
   - Check if special characters are properly escaped
   - Verify HTML validation in cards

## 📋 Diagnostic Checklist

When reporting issues, please provide:

### System Information

```bash
# Gather system info
node --version
npm --version
ankiniki --version  # If CLI is working

# VS Code version (if using extension)
code --version

# Anki version and addons
# Help → About Anki
# Tools → Add-ons → Check for updates
```

### Log Information

- Error messages (exact text)
- Console output
- Log files (if available)
- Screenshots of errors

### Reproduction Steps

1. Step-by-step instructions
2. Expected vs actual behavior
3. Frequency of issue (always/sometimes/rare)

### Environment Details

- Operating system and version
- Network configuration (proxy, firewall)
- Anki deck size and complexity
- Any custom configurations

## 🆘 Getting Help

### Self-Help Resources

1. **Documentation**: Check all relevant guides first
2. **GitHub Issues**: Search existing issues
3. **Community Forums**: Anki community discussions

### Reporting Issues

1. **GitHub Issues**: For bugs and feature requests
2. **Include diagnostic information** (see checklist above)
3. **Provide minimal reproduction case**
4. **Check if issue persists with fresh install**

### Emergency Workarounds

If you need immediate functionality:

1. **Use Anki directly** as fallback
2. **Manual card creation** until issue resolved
3. **Alternative tools** temporarily if needed
4. **Backup data** before attempting fixes

---

_This troubleshooting guide is continuously updated based on user feedback and common issues. If you find a solution not covered here, please contribute it back to the community!_
