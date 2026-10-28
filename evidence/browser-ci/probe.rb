require 'yaml'
workflow = YAML.load_file(ARGV.fetch(0))
jobs = workflow.fetch('jobs')
if jobs.key?('browser')
  commands = jobs.fetch('browser').fetch('steps').map { |step| step['run'] }.compact
  ['npm ci', 'npx playwright install chromium --with-deps', 'npm run build', 'npm run test:e2e'].each do |command|
    raise "Missing browser CI command: #{command}" unless commands.include?(command)
  end
end
puts 'jobs=' + jobs.keys.join(',')
