import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { ChatWidget } from '../src/components/ChatWidget';
import { BASE_URL, QUERY_URL, server } from './server';

const props = {
  apiKey: 'test-api-key',
  workspace: 'test-workspace',
  baseUrl: BASE_URL,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/** The panel is present but `aria-hidden` while closed. */
const panel = () => screen.getByRole('dialog', { hidden: true });

describe('<ChatWidget />', () => {
  it('renders the toggle button', () => {
    render(<ChatWidget {...props} />);
    expect(screen.getByRole('button', { name: 'Open chat' })).toBeInTheDocument();
  });

  it('keeps the chat window hidden by default', () => {
    render(<ChatWidget {...props} />);
    expect(panel()).toHaveAttribute('aria-hidden', 'true');
    expect(panel()).not.toHaveClass('pluginai-window--open');
  });

  it('opens the chat window when the toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<ChatWidget {...props} />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));

    expect(panel()).toHaveClass('pluginai-window--open');
    expect(panel()).toHaveAttribute('aria-hidden', 'false');
  });

  it('closes the chat window via the header close button', async () => {
    const user = userEvent.setup();
    render(<ChatWidget {...props} />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.click(screen.getByRole('button', { name: 'Close chat panel' }));

    expect(panel()).not.toHaveClass('pluginai-window--open');
  });

  it('shows the welcome message when opened', async () => {
    const user = userEvent.setup();
    render(<ChatWidget {...props} welcomeMessage="Hey there, ask away!" />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));

    expect(screen.getByText('Hey there, ask away!')).toBeInTheDocument();
  });

  it('renders the configured title and subtitle', () => {
    render(<ChatWidget {...props} title="Support Bot" subtitle="Always on" />);

    expect(screen.getByText('Support Bot')).toBeInTheDocument();
    expect(screen.getByText('Always on')).toBeInTheDocument();
  });

  it('shows the typing indicator while a request is in flight', async () => {
    const user = userEvent.setup();
    let release: (() => void) | undefined;

    server.use(
      http.post(QUERY_URL, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ respons: 'Done', status: 'success' });
      }),
    );

    render(<ChatWidget {...props} />);
    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByLabelText('Message'), 'Hello{Enter}');

    expect(await screen.findByLabelText('Assistant is typing')).toBeInTheDocument();

    release?.();
    await waitFor(() =>
      expect(screen.queryByLabelText('Assistant is typing')).not.toBeInTheDocument(),
    );
  });

  it('displays both the question and the answer after sending', async () => {
    const user = userEvent.setup();
    render(<ChatWidget {...props} />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByLabelText('Message'), 'What is the refund policy?{Enter}');

    expect(screen.getByText('What is the refund policy?')).toBeInTheDocument();
    expect(
      await screen.findByText('The refund window is 30 days.'),
    ).toBeInTheDocument();
  });

  it('clears the input after sending', async () => {
    const user = userEvent.setup();
    render(<ChatWidget {...props} />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    const input = screen.getByLabelText('Message');
    await user.type(input, 'Hello{Enter}');

    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<ChatWidget {...props} />);

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    const input = screen.getByLabelText('Message');
    await user.type(input, 'Line one{Shift>}{Enter}{/Shift}Line two');

    expect(input).toHaveValue('Line one\nLine two');
  });

  it('hides the "Powered by" footer when showPoweredBy is false', () => {
    render(<ChatWidget {...props} showPoweredBy={false} />);
    expect(screen.queryByRole('link', { name: 'PluginAI' })).not.toBeInTheDocument();
  });

  it('applies the primary color and position to the root container', () => {
    const { container } = render(
      <ChatWidget {...props} primaryColor="#ff0055" position="bottom-left" />,
    );

    const root = container.querySelector('#pluginai-widget-container');
    expect(root).toHaveClass('pluginai-widget--bottom-left');
    expect(root).toHaveStyle({ '--pluginai-primary': '#ff0055' });
  });
});
