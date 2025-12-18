# Contributing to Powervault P3 Local Control

Thank you for your interest in contributing! This project relies on the community to help document and improve local control of Powervault P3 systems.

## How to Contribute

### Reporting Issues

If you find a bug or have a question:

1. Check existing issues first
2. Open a new issue with:
   - Your P3 model/capacity
   - Home Assistant version (if applicable)
   - Steps to reproduce the problem
   - Any error messages

### Sharing Discoveries

If you've discovered something new about the P3:

1. **MQTT Topics** - New topics or data formats
2. **P18 Commands** - Inverter control commands that work
3. **Hardware Details** - Board revisions, component identification
4. **Serial Access** - Console login details, baud rates

Please open an issue or PR with your findings!

### Submitting Pull Requests

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-discovery`
3. Make your changes
4. Test if applicable
5. Submit a pull request

### Code Style

For YAML files:
- Use 2 spaces for indentation
- Include comments explaining non-obvious configurations
- Test in Home Assistant before submitting

For documentation:
- Use clear, concise language
- Include examples where helpful
- Update the table of contents if adding new sections

## What We Need Help With

### High Priority

- [ ] P18 protocol command testing
- [ ] Web API authentication bypass/documentation
- [ ] Serial console access procedure
- [ ] Different P3 model variations

### Medium Priority

- [ ] Additional MQTT topic documentation
- [ ] Home Assistant automation examples
- [ ] Energy dashboard configuration
- [ ] Historical data export

### Nice to Have

- [ ] Mobile app alternatives
- [ ] Grafana dashboards
- [ ] Node-RED flows
- [ ] ESPHome integrations

## Safety Guidelines

⚠️ **Important**: When contributing information about control commands:

1. **Test carefully** - Battery systems can be dangerous
2. **Document risks** - Note any potential issues
3. **Don't share credentials** - Never commit passwords or tokens
4. **Respect others' systems** - Don't encourage unsafe modifications

## Code of Conduct

- Be respectful and helpful
- Share knowledge freely
- Give credit to original discoverers
- Keep discussions constructive

## Questions?

Open an issue or join the [Powervault Owners Facebook Group](https://www.facebook.com/groups/powervaultowners) for discussion.
