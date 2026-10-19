# Run after jekyll build: bundle exec ruby _tests/i18n.rb [destination] [baseurl]
require "yaml"
require "nokogiri"
require "uri"
require "digest"

root = File.expand_path("..", __dir__)
destination = File.expand_path(ARGV[0] || "_site", root)
config = YAML.load_file(File.join(root, "_config.yml"), aliases: true)
baseurl = ARGV[1] || config.fetch("baseurl", "")
home = YAML.load_file(File.join(root, "_data/home.yml"))
translations = %w[zh en].to_h do |language|
  [language, YAML.load_file(File.join(root, "_data/i18n/#{language}.yml"))]
end
errors = []
check = ->(condition, message) { errors << message unless condition }

def translation_keys(value, prefix = "")
  return [prefix] unless value.is_a?(Hash)
  value.flat_map { |key, child| translation_keys(child, "#{prefix}/#{key}") }.sort
end

check.call(translation_keys(translations["zh"]) == translation_keys(translations["en"]), "Translation keys differ between Chinese and English")
translations.each do |language, text|
  %w[news experiences projects awards services].each do |section|
    home.fetch(section).each do |entry|
      check.call(text.fetch(section).key?(entry.fetch("id")), "#{language}: missing #{section}/#{entry['id']}")
    end
  end
  home.fetch("skills").each do |id|
    check.call(text.fetch("skills").key?(id), "#{language}: missing skill #{id}")
  end
end

translations.each do |language, text|
  route = text.fetch("home_path")
  path = File.join(destination, route.delete_prefix("/"), "index.html")
  doc = Nokogiri::HTML(File.read(path))
  label = "#{language} homepage"
  check.call(doc.at_css("html")["lang"] == text.fetch("lang"), "#{label}: wrong document language")
  check.call(doc.at_css("title").text == text.dig("seo", "title"), "#{label}: wrong title")
  check.call(doc.at_css('meta[name="description"]')["content"] == text.dig("seo", "description"), "#{label}: wrong description")
  check.call(doc.at_css('meta[property="og:locale"]')["content"] == text.fetch("locale"), "#{label}: wrong Open Graph locale")
  canonical = URI.parse(doc.at_css('link[rel="canonical"]')["href"])
  check.call(canonical.path == "#{baseurl}#{route}", "#{label}: wrong canonical URL")

  { "zh-CN" => "/", "en" => "/en/", "x-default" => "/" }.each do |lang, target|
    alternate = doc.at_css("link[hreflang='#{lang}']")
    check.call(alternate && URI.parse(alternate["href"]).path == "#{baseurl}#{target}", "#{label}: missing or incorrect #{lang} alternate")
  end

  switch = doc.at_css(".language-switch")
  check.call(switch.css("a[aria-current='true']").length == 1, "#{label}: language selection is ambiguous")
  check.call(URI.parse(switch.at_css("a[aria-current='true']")["href"]).path == "#{baseurl}#{route}", "#{label}: wrong active language")
  check.call(switch.css("a").map { |a| a["href"] }.sort == ["#{baseurl}/", "#{baseurl}/en/"].sort, "#{label}: language links must work without JavaScript")

  sections = %w[news experience projects awards services talks]
  sections.each do |id|
    check.call(doc.css("[id='#{id}']").length == 1, "#{label}: missing or duplicate #{id} anchor")
    check.call(doc.css("#site-nav a").any? { |a| a["href"] == "#{baseurl}#{route}##{id}" }, "#{label}: navigation leaves the current language at #{id}")
  end
  { ".news-list > li" => "news", ".experience-card" => "experiences", ".project-card" => "projects", ".award-card" => "awards", ".service-item" => "services", ".skill-card" => "skills" }.each do |selector, section|
    check.call(doc.css(selector).length == home.fetch(section).length, "#{label}: lost or duplicated #{section} entries")
  end

  doc.css("img[src]").each do |img|
    url = URI.parse(img["src"])
    next if url.host && url.host != canonical.host
    check.call(url.path.start_with?("#{baseurl}/images/"), "#{label}: image path is not baseurl-safe: #{url}")
    asset = URI::DEFAULT_PARSER.unescape(url.path.delete_prefix(baseurl).delete_prefix("/"))
    check.call(File.file?(File.join(destination, asset)), "#{label}: missing image #{asset}")
  end
  resume_path = language == "en" ? "/files/wuqi_resume_en.pdf" : "/files/wuqi_resume.pdf"
  check.call(text.fetch("resume_path") == resume_path, "#{label}: resume language is incorrect")
  resume = doc.css("#site-nav a").find { |a| a["href"] == "#{baseurl}#{resume_path}" }
  check.call(resume && resume.text == text.dig("navigation", "resume"), "#{label}: wrong resume label or URL")
  built_resume = File.join(destination, resume_path.delete_prefix("/"))
  source_resume = File.join(root, resume_path.delete_prefix("/"))
  check.call(File.file?(built_resume), "#{label}: resume file missing")
  if File.file?(built_resume)
    check.call(File.binread(built_resume, 5) == "%PDF-", "#{label}: resume is not a PDF")
    check.call(Digest::SHA256.file(built_resume).hexdigest == Digest::SHA256.file(source_resume).hexdigest, "#{label}: built resume differs from source")
  end
  check.call(doc.at_css(".author__name").text == text.dig("author", "name"), "#{label}: author name is not localized")
  check.call(doc.at_css(".js-copy-email")["data-copied-label"] == text.dig("ui", "copied"), "#{label}: copy feedback is not localized")
  check.call(doc.css("a[href]").none? { |a| a["href"].include?("github.com/xiaoxiaoyuweixie/CampusX") }, "#{label}: private CampusX code link restored")
  check.call(doc.at_css(".project-card").css("a").any? { |a| a.text == "[#{text.dig('ui', 'prototype')}]" }, "#{label}: prototype link missing")

  if language == "en"
    doc.css("script, style, .language-switch").remove
    visible_text = doc.at_css("body").text.gsub("校易通CampusX", "")
    check.call(!visible_text.match?(/\p{Han}/), "English homepage contains untranslated Chinese text")
  end
end

abort errors.join("\n") unless errors.empty?
puts "PASS: translations, both homepage routes, language links, SEO, navigation, content, images, resume, and project links."
