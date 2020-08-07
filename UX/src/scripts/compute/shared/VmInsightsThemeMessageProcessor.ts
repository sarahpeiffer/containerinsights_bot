import { ErrorSeverity } from '../../shared/data-provider/TelemetryErrorSeverity';
import * as msg from '../../shared/MessagingProvider';
import * as $ from 'jquery';

export interface IVmInsightsThemeMessageResult {
    isDark: boolean,
    bodyTheme: string,
}

export interface IVmInsightsThemeMessage {
    name: string
}

export class VmInsightsThemeMessageProcessor {
    public static processMessage(theme: any, telemetry: any, telemetryEventsPrefix: string, currentBodyTheme: string)
        : IVmInsightsThemeMessageResult {
        if (!theme || !theme.name) {
            telemetry.logException(telemetryEventsPrefix + '.onStyleThemeInit',
                'VmInsightsThemeMessageProcessor.ts', ErrorSeverity.Error,
                { message: 'No theme object was passed from Azure portal' }, null);
            return { isDark: false, bodyTheme: msg.PortalThemes.Light };
        }
        const themeName: string = theme.name;
        let bodyTheme: string = msg.PortalThemes.Light;
        let isDark: boolean = false;
        if (themeName === msg.PortalThemes.Dark) {
            bodyTheme = themeName;
            isDark = true;
        }
        $('body').removeClass(`${currentBodyTheme}`).addClass(`${bodyTheme}`);
        return { isDark, bodyTheme };
    }
}
