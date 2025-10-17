#!/bin/bash

echo "🚀 GitHub Deployment Setup for Restaurant POS Pro"
echo "=================================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "   Visit: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git is installed"
echo ""

# Check if already a git repository
if [ -d ".git" ]; then
    echo "⚠️  This is already a Git repository."
    echo ""
    read -p "Do you want to add a new remote? (y/n): " add_remote
    if [ "$add_remote" = "y" ]; then
        read -p "Enter your GitHub repository URL: " repo_url
        git remote add origin "$repo_url" 2>/dev/null || git remote set-url origin "$repo_url"
        echo "✅ Remote added/updated"
    fi
else
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
    echo ""
    
    echo "📝 Adding files to Git..."
    git add .
    echo "✅ Files added"
    echo ""
    
    echo "💾 Creating initial commit..."
    git commit -m "Initial commit - Restaurant POS Pro v1.0.0"
    echo "✅ Initial commit created"
    echo ""
    
    echo "🔗 Now you need to:"
    echo "   1. Create a new repository on GitHub"
    echo "   2. Copy the repository URL"
    echo ""
    read -p "Enter your GitHub repository URL: " repo_url
    
    if [ -n "$repo_url" ]; then
        git remote add origin "$repo_url"
        git branch -M main
        echo ""
        echo "✅ Remote configured"
        echo ""
        echo "🚀 Ready to push to GitHub!"
        echo ""
        read -p "Push to GitHub now? (y/n): " do_push
        if [ "$do_push" = "y" ]; then
            git push -u origin main
            echo ""
            echo "✅ Code pushed to GitHub!"
            echo ""
            echo "🎉 Your repository is now on GitHub!"
            echo "   Visit: $repo_url"
        else
            echo ""
            echo "⏸️  To push later, run:"
            echo "   git push -u origin main"
        fi
    fi
fi

echo ""
echo "📚 Next Steps:"
echo "   1. View your code on GitHub"
echo "   2. Set repository to Private (recommended)"
echo "   3. Deploy using Render.com or Railway.app"
echo "   4. Read DEPLOYMENT_GUIDE.md for full instructions"
echo ""
echo "✅ Setup complete!"

