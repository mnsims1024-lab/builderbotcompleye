import json
import os
import subprocess
import shlex
import logging

# Configure logging to show process steps clearly
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class BuilderBot:
    def __init__(self, spec_file):
        logging.info(f"Loading configuration from {spec_file}")
        with open(spec_file, 'r', encoding='utf-8') as f:
            self.spec = json.load(f)

    def _run_command(self, command, cwd):
        """Helper to run shell commands safely with logging."""
        logging.info(f"Executing: {command}")
        try:
            subprocess.run(shlex.split(command), cwd=cwd, check=True)
        except subprocess.CalledProcessError as e:
            logging.error(f"Command '{e.cmd}' failed with return code {e.returncode}")
            raise SystemExit(1)
        except FileNotFoundError:
            logging.error(f"Command '{command}' not found. Ensure it is installed and in your PATH.")
            raise SystemExit(1)

    def build(self):
        project_dir = os.path.abspath(self.spec['project_name'])
        logging.info(f"Starting build in: {project_dir}")
        os.makedirs(project_dir, exist_ok=True)

        for file in self.spec['files']:
            safe_name = os.path.basename(file['name'])
            target_path = os.path.join(project_dir, safe_name)
            
            logging.info(f"Creating file: {safe_name}")
            with open(target_path, 'w', encoding='utf-8') as f:
                if file['content_type'] == 'template':
                    with open(file['template'], 'r', encoding='utf-8') as t:
                        content = t.read()
                        for key, val in file.get('placeholders', {}).items():
                            content = content.replace(f'{{{key}}}', val['value'])
                        f.write(content)
                else:
                    f.write(file.get('content', ''))

        for script in self.spec['build_scripts']:
            self._run_command(script, project_dir)
        logging.info("Build process complete.")

    def deploy(self):
        project_dir = os.path.abspath(self.spec['project_name'])
        for platform in self.spec['deploy']:
            logging.info(f"Deploying to {platform['type']}...")
            self._run_command(platform['deploy_script'], project_dir)
        logging.info("Deployment process complete.")

def main():
    try:
        bot = BuilderBot('app_spec.json')
        bot.build()
        bot.deploy()
    except Exception as e:
        logging.critical(f"BuilderBot failed unexpectedly: {e}")

if __name__ == "__main__":
    main()