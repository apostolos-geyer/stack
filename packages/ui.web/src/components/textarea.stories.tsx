import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Textarea } from './textarea';

const meta = {
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Type your message here.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled textarea',
    value: 'Cannot edit this content',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here." id="message" />
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message-2">Your Message</Label>
      <Textarea placeholder="Type your message here." id="message-2" />
      <p className="text-sm text-muted-foreground">
        Your message will be copied to the support team.
      </p>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="invalid-message">Message</Label>
      <Textarea
        id="invalid-message"
        placeholder="Type your message here."
        aria-invalid="true"
        defaultValue="Too short"
      />
      <p className="text-sm text-destructive">Message must be at least 10 characters.</p>
    </div>
  ),
};
