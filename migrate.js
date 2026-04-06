const fs = require('fs');
const path = require('path');

function copyDirRecursiveSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);
    for (const file of files) {
        const currentSource = path.join(source, file);
        const currentTarget = path.join(target, file);

        if (fs.lstatSync(currentSource).isDirectory()) {
            copyDirRecursiveSync(currentSource, currentTarget);
        } else {
            console.log(`Copying ${currentSource} to ${currentTarget}`);
            fs.copyFileSync(currentSource, currentTarget);
        }
    }
}

async function migrate() {
    const tempDir = path.join(__dirname, '_temp_awallet');
    const frontendSrc = path.join(__dirname, 'frontend', 'src');

    // 1. Copy `_temp_awallet/components` to `frontend/src/components`
    copyDirRecursiveSync(path.join(tempDir, 'components'), path.join(frontendSrc, 'components'));

    // 2. Copy `_temp_awallet/src/components` to `frontend/src/components` (X402PaymentFeed, etc)
    copyDirRecursiveSync(path.join(tempDir, 'src', 'components'), path.join(frontendSrc, 'components'));

    // 3. Copy `_temp_awallet/src/adk` to `frontend/src/adk`
    copyDirRecursiveSync(path.join(tempDir, 'src', 'adk'), path.join(frontendSrc, 'adk'));

    // 4. Copy individual files needed
    const filesToCopy = [
        ['types.ts', 'types.ts'],
        ['walletSdk.ts', 'walletSdk.ts'],
        ['src/firebase.ts', 'firebase.ts'],
        ['firebase-applet-config.json', 'firebase-applet-config.json'],
        ['index.css', 'assets/css/index.css'],
        ['App.tsx', 'AWalletApp.tsx'],
        ['constants.ts', 'constants.ts']
    ];

    for (const [srcFile, destFile] of filesToCopy) {
        const srcPath = path.join(tempDir, srcFile);
        const destPath = path.join(frontendSrc, destFile);
        if (fs.existsSync(srcPath)) {
            console.log(`Copying ${srcPath} to ${destPath}`);
            fs.copyFileSync(srcPath, destPath);
        }
    }

    console.log("\nFixing imports in AWalletApp.tsx...");
    const appTsxPath = path.join(frontendSrc, 'AWalletApp.tsx');
    if (fs.existsSync(appTsxPath)) {
        let appContent = fs.readFileSync(appTsxPath, 'utf8');
        // Fix imports because we moved src/firebase.ts to firebase.ts and src/adk / src/components
        appContent = appContent.replace(/from '\.\/src\/firebase'/g, "from './firebase'");
        appContent = appContent.replace(/from '\.\/src\/components\/X402PaymentFeed'/g, "from './components/X402PaymentFeed'");
        appContent = appContent.replace(/from '\.\/src\/adk\/AWalletADK'/g, "from './adk/AWalletADK'");
        appContent = appContent.replace(/import { auth, signInWithGoogle, logout, db } from '\.\/firebase';/g, "import { auth, signInWithGoogle, logout, db } from './firebase';");
        fs.writeFileSync(appTsxPath, appContent);
    }

    console.log("\nFixing imports in X402PaymentFeed.tsx...");
    const feedPath = path.join(frontendSrc, 'components', 'X402PaymentFeed.tsx');
    if (fs.existsSync(feedPath)) {
         let feedContent = fs.readFileSync(feedPath, 'utf8');
         // It imported from '../../types.ts'. Now it's in `components/X402...` so `../types`
         feedContent = feedContent.replace(/from '\.\.\/\.\.\/types'/g, "from '../types'");
         feedContent = feedContent.replace(/from '\.\.\/\.\.\/types\.ts'/g, "from '../types'");
         fs.writeFileSync(feedPath, feedContent);
    }

    console.log("\nFixing imports in AWalletADK.ts...");
    const adkPath = path.join(frontendSrc, 'adk', 'AWalletADK.ts');
    if (fs.existsSync(adkPath)) {
         let adkContent = fs.readFileSync(adkPath, 'utf8');
         adkContent = adkContent.replace(/from '\.\.\/\.\.\/types'/g, "from '../types'");
         adkContent = adkContent.replace(/from '\.\.\/\.\.\/types\.ts'/g, "from '../types'");
         fs.writeFileSync(adkPath, adkContent);
    }

    console.log("\nUpdating frontend index.js to render AWalletApp...");
    const indexJsPath = path.join(frontendSrc, 'index.js');
    if (fs.existsSync(indexJsPath)) {
        let indexContent = fs.readFileSync(indexJsPath, 'utf8');
        indexContent = indexContent.replace(/import App from '\.\/components\/App';/g, "import App from './AWalletApp';\nimport './assets/css/index.css';");
        fs.writeFileSync(indexJsPath, indexContent);
    }

    console.log("\nMigration complete! Please run 'npm install' inside the frontend folder.");
}

migrate();
