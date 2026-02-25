{
  "manifest_version": 3,
  "name": "AT Helper Stats",
  "version": "1.0",
  "description": "Улучшенная статистика для Author.Today",
  "permissions": ["storage"],
  "content_scripts": [
    {
      "matches": ["https://author.today/report/work/stats*"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ]
}
